import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  getComplaintsByHall,
  studentConfirmComplaint,
  studentReplyToQuery,
} from "../../src/services/api";

export default function MyComplaints() {
  const params = useLocalSearchParams();

  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const roll = Array.isArray(params.roll) ? params.roll[0] : params.roll;
  const hall = Array.isArray(params.hall) ? params.hall[0] : params.hall;
  const initialFilter = Array.isArray(params.filter)
    ? params.filter[0]
    : params.filter;

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyTexts, setReplyTexts] = useState({});
  const [replyingId, setReplyingId] = useState(null);

  const loadComplaints = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await getComplaintsByHall(hall);

      if (!response.success) {
        setComplaints([]);
        Alert.alert("Error", response.message || "Failed to load complaints.");
        return;
      }

      const allComplaints = response.complaints || [];

      const visibleComplaints = allComplaints.filter((complaint) => {
        if (complaint.category === "mess") {
          return complaint.hall === hall;
        }

        return complaint.rollNumber === roll && complaint.studentName === name;
      });

      setComplaints(visibleComplaints);
    } catch (error) {
      setComplaints([]);
      Alert.alert("Error", error.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadComplaints();
    }, [hall, roll, name])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadComplaints(false);
  };

  const activeComplaints = useMemo(() => {
    let data = complaints.filter(
      (complaint) => getOverallComplaintState(complaint) !== "completed"
    );

    if (initialFilter === "query") {
      data = data.filter((complaint) => hasPendingQuery(complaint));
    }

    return data.sort((a, b) => {
      const aHasQuery = hasPendingQuery(a) ? 1 : 0;
      const bHasQuery = hasPendingQuery(b) ? 1 : 0;

      if (aHasQuery !== bHasQuery) {
        return bHasQuery - aHasQuery;
      }

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [complaints, initialFilter]);

  const historyComplaints = useMemo(() => {
    return complaints
      .filter((complaint) => getOverallComplaintState(complaint) === "completed")
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [complaints]);

  const handleConfirmResolved = async (id) => {
    try {
      const response = await studentConfirmComplaint(id);

      if (!response.success) {
        Alert.alert("Error", response.message || "Failed to confirm complaint.");
        return;
      }

      Alert.alert("Updated", "Complaint confirmed as resolved.");
      loadComplaints(false);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to confirm complaint.");
    }
  };

  const handleReplyToQuery = async (complaintId) => {
    const replyText = replyTexts[complaintId]?.trim();

    if (!replyText) {
      Alert.alert("Missing Reply", "Please write your reply first.");
      return;
    }

    try {
      setReplyingId(complaintId);

      const response = await studentReplyToQuery(complaintId, {
        replyText,
        repliedBy: name || "Student",
      });

      if (!response.success) {
        Alert.alert("Error", response.message || "Failed to send reply.");
        return;
      }

      setReplyTexts((prev) => ({
        ...prev,
        [complaintId]: "",
      }));

      Alert.alert("Reply Sent", "Your reply has been sent successfully.");
      loadComplaints(false);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to send reply.");
    } finally {
      setReplyingId(null);
    }
  };

  const canStudentConfirmResolved = (complaint) => {
    return (
      complaint.category !== "mess" &&
      complaint.category !== "other" &&
      complaint.workerStatus === "completed" &&
      complaint.studentStatus !== "completed"
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.heading}>My Complaints</Text>

      {initialFilter === "query" && (
        <View style={styles.queryFilterBox}>
          <Text style={styles.queryFilterText}>
            Showing complaints that have supervisor queries.
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Active Complaints</Text>

      {loading ? (
        <Text style={styles.emptyText}>Loading complaints...</Text>
      ) : activeComplaints.length === 0 ? (
        <Text style={styles.emptyText}>
          {initialFilter === "query"
            ? "No complaint queries right now."
            : "No active complaints."}
        </Text>
      ) : (
        activeComplaints.map((complaint) => {
          const overallState = getOverallComplaintState(complaint);
          const hasQuery = hasPendingQuery(complaint);
          const previousReply =
            complaint.studentQueryReply || complaint.queryReply || "";

          return (
            <View
              key={complaint._id}
              style={[styles.card, hasQuery && styles.queryCard]}
            >
              <View style={styles.topRow}>
                <Text style={styles.type}>
                  {formatType(complaint.category)}
                </Text>

                {complaint.category !== "mess" && (
                  <View style={styles.rightBadges}>
                    <View
                      style={[
                        styles.statusBadge,
                        overallState === "escalated"
                          ? styles.escalated
                          : overallState === "conflict"
                          ? styles.conflict
                          : overallState === "completed"
                          ? styles.completed
                          : overallState === "open"
                          ? styles.open
                          : styles.pending,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {capitalize(
                          overallState === "open" ? "pending" : overallState
                        )}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.priorityBadge,
                        complaint.priority === "urgent"
                          ? styles.priorityUrgent
                          : complaint.priority === "high"
                          ? styles.priorityHigh
                          : complaint.priority === "medium"
                          ? styles.priorityMedium
                          : styles.priorityLow,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {capitalize(complaint.priority || "medium")}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <Text style={styles.title}>{complaint.title}</Text>
              <Text style={styles.description}>{complaint.description}</Text>

              {complaint.assignedWorker && complaint.category !== "mess" && (
                <Text style={styles.assignedText}>
                  Assigned Worker: {complaint.assignedWorker}
                </Text>
              )}

              {hasQuery && (
                <View style={styles.queryBox}>
                  <Text style={styles.queryBoxTitle}>Supervisor Query</Text>
                  <Text style={styles.queryBoxText}>
                    {complaint.latestQuery ||
                      complaint.queryText ||
                      "Query available"}
                  </Text>

                  {complaint.queryRaisedAt && (
                    <Text style={styles.queryMetaText}>
                      Raised At:{" "}
                      {new Date(complaint.queryRaisedAt).toLocaleString()}
                    </Text>
                  )}

                  {previousReply ? (
                    <View style={styles.replyPreviewBox}>
                      <Text style={styles.replyPreviewTitle}>
                        Your Previous Reply
                      </Text>
                      <Text style={styles.replyPreviewText}>
                        {previousReply}
                      </Text>
                    </View>
                  ) : null}

                  <TextInput
                    style={styles.replyInput}
                    placeholder="Write your reply here..."
                    placeholderTextColor="#FECACA"
                    multiline
                    value={replyTexts[complaint._id] || ""}
                    onChangeText={(text) =>
                      setReplyTexts((prev) => ({
                        ...prev,
                        [complaint._id]: text,
                      }))
                    }
                  />

                  <Pressable
                    style={[
                      styles.replyButton,
                      replyingId === complaint._id && styles.replyButtonDisabled,
                    ]}
                    onPress={() => handleReplyToQuery(complaint._id)}
                    disabled={replyingId === complaint._id}
                  >
                    <Text style={styles.replyButtonText}>
                      {replyingId === complaint._id
                        ? "Sending Reply..."
                        : "Send Reply"}
                    </Text>
                  </Pressable>
                </View>
              )}

              {complaint.category !== "mess" &&
                complaint.category !== "other" &&
                !hasQuery &&
                (complaint.workerStatus !== "completed" ? (
                  <View style={styles.disabledBox}>
                    <Text style={styles.disabledText}>
                      Waiting for worker to complete this complaint
                    </Text>
                  </View>
                ) : canStudentConfirmResolved(complaint) ? (
                  <Pressable
                    style={styles.confirmButton}
                    onPress={() => handleConfirmResolved(complaint._id)}
                  >
                    <Text style={styles.confirmButtonText}>
                      Confirm Resolved
                    </Text>
                  </Pressable>
                ) : null)}

              {complaint.assignedAt && complaint.category !== "mess" && (
                <Text style={styles.detail}>
                  Taken Over At:{" "}
                  {new Date(complaint.assignedAt).toLocaleString()}
                </Text>
              )}

              {complaint.category !== "mess" && (
                <>
                  <Text style={styles.detail}>
                    Worker Status: {capitalize(complaint.workerStatus)}
                  </Text>
                  <Text style={styles.detail}>
                    Student Status: {capitalize(complaint.studentStatus)}
                  </Text>
                </>
              )}

              {complaint.highlightedByWarden && (
                <View style={styles.highlightBox}>
                  <Text style={styles.highlightBoxText}>
                    This complaint has been highlighted by the warden.
                  </Text>
                  {complaint.highlightedAt && (
                    <Text style={styles.highlightTime}>
                      Highlighted At:{" "}
                      {new Date(complaint.highlightedAt).toLocaleString()}
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}

      <Text style={[styles.sectionTitle, styles.historyTitle]}>
        Complaint History
      </Text>

      {loading ? null : historyComplaints.length === 0 ? (
        <Text style={styles.emptyText}>No resolved complaint history yet.</Text>
      ) : (
        historyComplaints.map((complaint) => (
          <View key={complaint._id} style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.type}>{formatType(complaint.category)}</Text>

              {complaint.category !== "mess" && (
                <View style={styles.rightBadges}>
                  <View style={[styles.statusBadge, styles.completed]}>
                    <Text style={styles.statusText}>Completed</Text>
                  </View>

                  <View
                    style={[
                      styles.priorityBadge,
                      complaint.priority === "urgent"
                        ? styles.priorityUrgent
                        : complaint.priority === "high"
                        ? styles.priorityHigh
                        : complaint.priority === "medium"
                        ? styles.priorityMedium
                        : styles.priorityLow,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {capitalize(complaint.priority || "medium")}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.title}>{complaint.title}</Text>
            <Text style={styles.description}>{complaint.description}</Text>

            {complaint.assignedWorker && complaint.category !== "mess" && (
              <Text style={styles.assignedText}>
                Assigned Worker: {complaint.assignedWorker}
              </Text>
            )}

            {complaint.workerCompletedAt && complaint.category !== "mess" && (
              <Text style={styles.detail}>
                Worker Completed:{" "}
                {new Date(complaint.workerCompletedAt).toLocaleString()}
              </Text>
            )}

            {complaint.completedAt && complaint.category !== "mess" && (
              <Text style={styles.detail}>
                Final Completion:{" "}
                {new Date(complaint.completedAt).toLocaleString()}
              </Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function hasPendingQuery(complaint) {
  const hasQuery = !!(
    complaint.latestQuery ||
    complaint.queryText
  );

  const hasReply = !!(
    complaint.studentQueryReply ||
    complaint.queryReply
  );

  return hasQuery && !hasReply;
}

function getOverallComplaintState(complaint) {
  if (complaint.highlightedByWarden || complaint.escalated) return "escalated";
  if (
    complaint.studentStatus === "completed" ||
    complaint.status === "completed"
  ) {
    return "completed";
  }
  if (
    complaint.workerStatus === "completed" &&
    complaint.status !== "completed"
  ) {
    return "conflict";
  }
  if (
    complaint.status === "assigned" ||
    complaint.status === "in_progress" ||
    complaint.workerStatus === "accepted"
  ) {
    return "open";
  }
  return "pending";
}

function formatType(type) {
  if (type === "sports") return "🏋️ Sports";
  if (type === "gym") return "🏋️ Gym";
  if (type === "civil") return "🧱 Civil";
  if (type === "electricity") return "💡 Electricity";
  if (type === "mess") return "🍽️ Mess";
  if (type === "other") return "🚨 Other";
  return capitalize(type || "other");
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F2C",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 30,
    fontWeight: "800",
    color: "#F5F7FF",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#D7DBF5",
    marginBottom: 14,
    marginTop: 6,
  },
  historyTitle: {
    marginTop: 18,
  },
  emptyText: {
    fontSize: 15,
    color: "#A9B0D6",
    marginBottom: 18,
  },
  queryFilterBox: {
    backgroundColor: "#3A1020",
    borderWidth: 1,
    borderColor: "#B91C1C",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  queryFilterText: {
    color: "#FECACA",
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    backgroundColor: "#141D6B",
  },
  queryCard: {
    backgroundColor: "#3A1020",
    borderColor: "#DC2626",
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  type: {
    fontSize: 15,
    fontWeight: "700",
    color: "#DCE3FF",
    flex: 1,
    paddingRight: 8,
  },
  rightBadges: {
    alignItems: "flex-end",
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    color: "#D6DBF5",
    marginBottom: 10,
    lineHeight: 21,
  },
  detail: {
    fontSize: 14,
    color: "#AEB8E8",
    marginBottom: 5,
  },
  assignedText: {
    marginBottom: 8,
    fontSize: 13,
    color: "#8EC5FF",
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pending: {
    backgroundColor: "#F59E0B",
  },
  completed: {
    backgroundColor: "#10B981",
  },
  conflict: {
    backgroundColor: "#EF4444",
  },
  escalated: {
    backgroundColor: "#7C3AED",
  },
  open: {
    backgroundColor: "#3B82F6",
  },
  priorityUrgent: {
    backgroundColor: "#DC2626",
  },
  priorityHigh: {
    backgroundColor: "#F97316",
  },
  priorityMedium: {
    backgroundColor: "#3B82F6",
  },
  priorityLow: {
    backgroundColor: "#6B7280",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  confirmButton: {
    backgroundColor: "#1E2D8F",
    borderWidth: 1,
    borderColor: "#4A63FF",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
  highlightBox: {
    marginTop: 10,
    backgroundColor: "#2A1F5F",
    borderWidth: 1,
    borderColor: "#8B5CF6",
    borderRadius: 12,
    padding: 12,
  },
  highlightBoxText: {
    color: "#E9DDFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  highlightTime: {
    color: "#CFC4FF",
    fontSize: 13,
  },
  disabledBox: {
    marginTop: 5,
    marginBottom: 10,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#3E3ED0",
  },
  disabledText: {
    color: "#D1D5DB",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  queryBox: {
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: "#4A1324",
    borderWidth: 1,
    borderColor: "#F87171",
    borderRadius: 12,
    padding: 12,
  },
  queryBoxTitle: {
    color: "#FECACA",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  queryBoxText: {
    color: "#FFE4E6",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
  queryMetaText: {
    color: "#FCA5A5",
    fontSize: 12,
    marginBottom: 10,
  },
  replyPreviewBox: {
    backgroundColor: "#2E1065",
    borderWidth: 1,
    borderColor: "#8B5CF6",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  replyPreviewTitle: {
    color: "#DDD6FE",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  replyPreviewText: {
    color: "#F3E8FF",
    fontSize: 13,
    lineHeight: 19,
  },
  replyInput: {
    minHeight: 90,
    backgroundColor: "#2B0B16",
    borderWidth: 1,
    borderColor: "#F87171",
    borderRadius: 10,
    padding: 12,
    color: "#FFFFFF",
    textAlignVertical: "top",
    marginBottom: 10,
  },
  replyButton: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  replyButtonDisabled: {
    opacity: 0.7,
  },
  replyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});