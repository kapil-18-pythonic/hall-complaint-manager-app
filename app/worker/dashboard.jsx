import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  getWorkerComplaints,
  workerTakeoverComplaint,
  workerCompleteComplaint,
} from "../../src/services/api";

export default function WorkerDashboard() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const hall = Array.isArray(params.hall) ? params.hall[0] : params.hall;
  const type = Array.isArray(params.type) ? params.type[0] : params.type;
  const workerId = Array.isArray(params.workerId)
    ? params.workerId[0]
    : params.workerId;

  const [searchText, setSearchText] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [viewMode, setViewMode] = useState("available");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadComplaints = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await getWorkerComplaints(hall, type);

      if (response.success) {
        setComplaints(response.complaints || []);
      } else {
        setComplaints([]);
        Alert.alert("Error", response.message || "Failed to load complaints.");
      }
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
    }, [hall, type])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadComplaints(false);
  };

  const availableComplaints = useMemo(() => {
    return complaints.filter((complaint) => !complaint.assignedWorker);
  }, [complaints]);

  const myComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      if (workerId && complaint.assignedWorkerId) {
        return String(complaint.assignedWorkerId) === String(workerId);
      }
      return complaint.assignedWorker === name;
    });
  }, [complaints, workerId, name]);

  const complaintsToShow = useMemo(() => {
    if (viewMode === "my-tasks") return myComplaints;
    if (viewMode === "available") return availableComplaints;
    return complaints;
  }, [viewMode, myComplaints, availableComplaints, complaints]);

  const filteredComplaints = useMemo(() => {
    const text = searchText.trim().toLowerCase();

    return complaintsToShow.filter((complaint) => {
      const overallState = getOverallComplaintState(complaint);

      const matchesSearch =
        !text ||
        complaint.title?.toLowerCase().includes(text) ||
        complaint.description?.toLowerCase().includes(text) ||
        complaint.hall?.toLowerCase().includes(text) ||
        complaint.category?.toLowerCase().includes(text) ||
        complaint.studentName?.toLowerCase().includes(text) ||
        complaint.rollNumber?.toLowerCase().includes(text) ||
        complaint.assignedWorker?.toLowerCase().includes(text);

      const matchesState =
        stateFilter === "all" ||
        overallState === stateFilter ||
        (stateFilter === "pending" &&
          (overallState === "open" || overallState === "pending"));

      return matchesSearch && matchesState;
    });
  }, [complaintsToShow, searchText, stateFilter]);

  const sortedComplaints = useMemo(() => {
    return [...filteredComplaints].sort(
      (a, b) =>
        priorityRank(a.priority || "medium") - priorityRank(b.priority || "medium")
    );
  }, [filteredComplaints]);

  const counts = useMemo(() => {
    const sourceList = complaintsToShow;

    return {
      all: sourceList.length,
      pending: sourceList.filter((complaint) => {
        const state = getOverallComplaintState(complaint);
        return state === "pending" || state === "open";
      }).length,
      conflict: sourceList.filter(
        (complaint) => getOverallComplaintState(complaint) === "conflict"
      ).length,
      completed: sourceList.filter(
        (complaint) => getOverallComplaintState(complaint) === "completed"
      ).length,
      escalated: sourceList.filter(
        (complaint) => getOverallComplaintState(complaint) === "escalated"
      ).length,
    };
  }, [complaintsToShow]);

  const handleTakeComplaint = async (id) => {
    try {
      const result = await workerTakeoverComplaint(id, {
        workerName: name,
        workerId: workerId ? String(workerId) : String(name),
        workerType: type,
      });

      if (!result.success) {
        Alert.alert("Unavailable", result.message || "Could not take complaint.");
        return;
      }

      Alert.alert("Success", "You have taken this complaint.");
      loadComplaints(false);
    } catch (error) {
      Alert.alert("Error", error.message || "Could not take complaint.");
    }
  };

  const handleMarkCompleted = async (id) => {
    try {
      const result = await workerCompleteComplaint(id);

      if (!result.success) {
        Alert.alert("Error", result.message || "Could not update complaint.");
        return;
      }

      Alert.alert("Updated", "Complaint marked as completed.");
      loadComplaints(false);
    } catch (error) {
      Alert.alert("Error", error.message || "Could not update complaint.");
    }
  };

  const openComplaintDetails = (complaint) => {
    router.push({
      pathname: "/worker/complaint-details",
      params: {
        id: complaint._id,
        name,
        hall,
        type,
        workerId,
      },
    });
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
      <Text style={styles.heading}>{formatType(type) || "Worker"} Dashboard</Text>

      <View style={styles.profileCard}>
        <Text style={styles.welcome}>Welcome, {name || "Worker"}</Text>
        <Text style={styles.info}>Hall: {hall || "Not Assigned"}</Text>
        <Text style={styles.info}>Type: {formatType(type) || "Not Assigned"}</Text>
      </View>

      <View style={styles.toggleRow}>
        <Pressable
          style={[
            styles.toggleButton,
            viewMode === "available" && styles.activeToggle,
          ]}
          onPress={() => setViewMode("available")}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === "available" && styles.activeToggleText,
            ]}
          >
            Available
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.toggleButton,
            viewMode === "all" && styles.activeToggle,
          ]}
          onPress={() => setViewMode("all")}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === "all" && styles.activeToggleText,
            ]}
          >
            All Complaints
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.toggleButton,
            viewMode === "my-tasks" && styles.activeToggle,
          ]}
          onPress={() => setViewMode("my-tasks")}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === "my-tasks" && styles.activeToggleText,
            ]}
          >
            My Tasks
          </Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search complaints"
        placeholderTextColor="#8C96C8"
        value={searchText}
        onChangeText={setSearchText}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {["all", "pending", "conflict", "completed", "escalated"].map((item) => (
          <Pressable
            key={item}
            style={[
              styles.filterChip,
              stateFilter === item && styles.activeFilterChip,
            ]}
            onPress={() => setStateFilter(item)}
          >
            <Text
              style={[
                styles.filterText,
                stateFilter === item && styles.activeFilterText,
              ]}
            >
              {capitalize(item)} ({counts[item] || 0})
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>
        {viewMode === "my-tasks"
          ? "My Selected Complaints"
          : viewMode === "available"
          ? "Available Complaints"
          : "All Complaints"}
      </Text>

      {loading ? (
        <Text style={styles.emptyText}>Loading complaints...</Text>
      ) : sortedComplaints.length === 0 ? (
        <Text style={styles.emptyText}>No complaints found.</Text>
      ) : (
        sortedComplaints.map((complaint) => {
          const overallState = getOverallComplaintState(complaint);
          const takenBySomeoneElse =
            complaint.assignedWorker && complaint.assignedWorker !== name;
          const takenByMe =
            complaint.assignedWorker === name ||
            (workerId &&
              complaint.assignedWorkerId &&
              String(complaint.assignedWorkerId) === String(workerId));

          return (
            <Pressable
              key={complaint._id}
              style={styles.card}
              onPress={() => openComplaintDetails(complaint)}
            >
              <View style={styles.topRow}>
                <Text style={styles.cardType}>{formatType(complaint.category)}</Text>

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
              </View>

              <Text style={styles.title}>{complaint.title}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {complaint.description}
              </Text>

              {complaint.roomNo && (
                <Text style={styles.detail}>Room No: {complaint.roomNo}</Text>
              )}

              {complaint.mobileNo && (
                <Text style={styles.detail}>Mobile: {complaint.mobileNo}</Text>
              )}

              <Text style={styles.detail}>
                Submitted By: {complaint.studentName || "Not Available"}
              </Text>

              <Text style={styles.detail}>
                Roll: {complaint.rollNumber || "Not Available"}
              </Text>

              {complaint.assignedWorker ? (
                <Text
                  style={[
                    styles.assignedText,
                    takenByMe ? styles.assignedToMe : styles.assignedToOther,
                  ]}
                >
                  Assigned Worker: {complaint.assignedWorker}
                </Text>
              ) : (
                <Text style={styles.waitingText}>
                  No worker has taken this complaint yet.
                </Text>
              )}

              {complaint.highlightedByWarden && (
                <View style={styles.highlightBadge}>
                  <Text style={styles.highlightBadgeText}>
                    Highlighted by Warden
                  </Text>
                </View>
              )}

              {complaint.assignedAt && (
                <Text style={styles.detail}>
                  Taken Over At: {new Date(complaint.assignedAt).toLocaleString()}
                </Text>
              )}

              <Text style={styles.detail}>
                Worker Status: {capitalize(complaint.workerStatus || "pending")}
              </Text>

              <Text style={styles.detail}>
                Student Status: {capitalize(complaint.studentStatus || "pending")}
              </Text>

              <Text style={styles.viewMore}>Tap to view full details</Text>

              {!complaint.assignedWorker && (
                <Pressable
                  style={styles.takeButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleTakeComplaint(complaint._id);
                  }}
                >
                  <Text style={styles.takeButtonText}>Take Over Complaint</Text>
                </Pressable>
              )}

              {takenBySomeoneElse && (
                <Pressable style={styles.disabledTakeButton} disabled>
                  <Text style={styles.disabledTakeButtonText}>
                    Already Taken
                  </Text>
                </Pressable>
              )}

              {takenByMe &&
                complaint.workerStatus !== "completed" &&
                !complaint.escalated && (
                  <Pressable
                    style={styles.completeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleMarkCompleted(complaint._id);
                    }}
                  >
                    <Text style={styles.completeButtonText}>Mark Completed</Text>
                  </Pressable>
                )}
            </Pressable>
          );
        })
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
  if (type === "sports" || type === "gym") return "Sports & Gym";
  if (type === "civil") return "Civil";
  if (type === "electricity") return "Electricity";
  if (type === "mess") return "Mess";
  return type;
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function priorityRank(priority) {
  if (priority === "urgent") return 1;
  if (priority === "high") return 2;
  if (priority === "medium") return 3;
  return 4;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F2C",
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 48,
    paddingBottom: 36,
    marginTop: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F5F7FF",
    marginBottom: 18,
  },
  profileCard: {
    backgroundColor: "#141D6B",
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 25,
  },
  welcome: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F5F7FF",
    marginBottom: 8,
  },
  info: {
    fontSize: 15,
    color: "#AEB8E8",
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: "row",
    marginBottom: 19,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#141D6B",
  },
  activeToggle: {
    backgroundColor: "#1E2D8F",
    borderColor: "#4A63FF",
  },
  toggleText: {
    color: "#D7DBF5",
    fontWeight: "600",
    fontSize: 13,
  },
  activeToggleText: {
    color: "#FFFFFF",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 19,
    backgroundColor: "#141D6B",
    color: "#F5F7FF",
    fontSize: 15,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 12,
    marginBottom: 18,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#141D6B",
  },
  activeFilterChip: {
    backgroundColor: "#1E2D8F",
    borderColor: "#4A63FF",
  },
  filterText: {
    color: "#D7DBF5",
    fontSize: 13,
    fontWeight: "600",
  },
  activeFilterText: {
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f5f7ffce",
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 16,
    color: "#b0baec",
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
  cardType: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8FA8FF",
    flex: 1,
    marginRight: 10,
  },
  rightBadges: {
    alignItems: "flex-end",
    gap: 6,
  },
  detail: {
    fontSize: 14,
    color: "#AEB8E8",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5F7FF",
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    color: "#DCE3FF",
    marginBottom: 8,
    lineHeight: 22,
  },
  waitingText: {
    marginBottom: 6,
    fontSize: 13,
    color: "#AEB8E8",
    fontWeight: "600",
  },
  assignedText: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
  },
  assignedToMe: {
    color: "#10B981",
  },
  assignedToOther: {
    color: "#60A5FA",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  takeButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  takeButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledTakeButton: {
    backgroundColor: "#6B7280",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  disabledTakeButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
  completeButton: {
    backgroundColor: "#1E2D8F",
    borderWidth: 1,
    borderColor: "#4A63FF",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  completeButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
  highlightBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#7C3AED",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  highlightBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  viewMore: {
    marginTop: 8,
    fontSize: 13,
    color: "#8FA8FF",
    fontWeight: "700",
  },
});