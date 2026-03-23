import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  getComplaintsByHall,
  studentConfirmComplaint,
} from "../../src/services/api";

export default function MyComplaints() {
  const params = useLocalSearchParams();

  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const roll = Array.isArray(params.roll) ? params.roll[0] : params.roll;
  const hall = Array.isArray(params.hall) ? params.hall[0] : params.hall;

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

        return (
          complaint.rollNumber === roll && complaint.studentName === name
        );
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
    return complaints.filter(
      (complaint) => getOverallComplaintState(complaint) !== "completed"
    );
  }, [complaints]);

  const historyComplaints = useMemo(() => {
    return complaints.filter(
      (complaint) => getOverallComplaintState(complaint) === "completed"
    );
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

  const canStudentConfirmResolved = (complaint) => {
    return (
      complaint.category !== "mess" &&
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

      <Text style={styles.sectionTitle}>Active Complaints</Text>

      {loading ? (
        <Text style={styles.emptyText}>Loading complaints...</Text>
      ) : activeComplaints.length === 0 ? (
        <Text style={styles.emptyText}>No active complaints.</Text>
      ) : (
        activeComplaints.map((complaint) => {
          const overallState = getOverallComplaintState(complaint);

          return (
            <View key={complaint._id} style={styles.card}>
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

              {complaint.category !== "mess" && (
                <>
                  {complaint.workerStatus !== "completed" ? (
                    <View style={styles.disabledBox}>
                      <Text style={styles.disabledText}>
                        Waiting for worker to complete this complaint
                      </Text>
                    </View>
                  ) : complaint.studentStatus !== "completed" ? (
                    <Pressable
                      style={styles.confirmButton}
                      onPress={() => handleConfirmResolved(complaint._id)}
                    >
                      <Text style={styles.confirmButtonText}>
                        Confirm Resolved
                      </Text>
                    </Pressable>
                  ) : null}
                </>
              )}

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

              {canStudentConfirmResolved(complaint) && (
                <Pressable
                  style={styles.confirmButton}
                  onPress={() => handleConfirmResolved(complaint._id)}
                >
                  <Text style={styles.confirmButtonText}>
                    Confirm Resolved
                  </Text>
                </Pressable>
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
              <Text style={styles.type}>
                {formatType(complaint.category)}
              </Text>

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

function getOverallComplaintState(complaint) {
  if (complaint.highlightedByWarden || complaint.escalated) return "escalated";
  if (complaint.studentStatus === "completed" || complaint.status === "completed") {
    return "completed";
  }
  if (complaint.workerStatus === "completed" && complaint.status !== "completed") {
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
  card: {
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    backgroundColor: "#141D6B",
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
    backgroundColor: "#3e3ed0",
  },
  disabledText: {
    color: "#D1D5DB",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
});