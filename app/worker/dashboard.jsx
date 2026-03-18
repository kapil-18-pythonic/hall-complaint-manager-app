import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors } from "../../src/constants/colors";
import {
  getComplaints,
  markComplaintCompleted,
  getOverallComplaintState,
  searchAndFilterComplaints,
  assignWorkerToComplaint,
} from "../../src/store/complaintsStore";

export default function WorkerDashboard() {
  const { name, hall, type, workerId } = useLocalSearchParams();

  const [searchText, setSearchText] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [viewMode, setViewMode] = useState("available");

  const allComplaints = getComplaints();

  const workerComplaints = allComplaints.filter(
    (complaint) =>
      complaint.type !== "mess" &&
      complaint.type === type &&
      complaint.hall === hall
  );

  const availableComplaints = workerComplaints.filter(
    (complaint) => !complaint.assignedWorker
  );

  const myComplaints = workerComplaints.filter(
    (complaint) => complaint.assignedWorker === name
  );

  const complaintsToShow =
    viewMode === "my-tasks" ? myComplaints : workerComplaints;

  const filteredComplaints = useMemo(() => {
    return searchAndFilterComplaints({
      complaintsList: complaintsToShow,
      searchText,
      state: stateFilter,
    });
  }, [complaintsToShow, searchText, stateFilter]);

  const sortedComplaints = [...filteredComplaints].sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority)
  );

  const handleTakeComplaint = (id) => {
    const result = assignWorkerToComplaint(
      id,
      name,
      workerId ? String(workerId) : String(name)
    );

    if (!result.success) {
      Alert.alert("Unavailable", result.message);
      return;
    }

    Alert.alert("Success", "You have taken this complaint.");
  };

  const handleMarkCompleted = (id) => {
    markComplaintCompleted(id);
    Alert.alert("Updated", "Complaint marked as completed.");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Worker Dashboard</Text>

      <View style={styles.profileCard}>
        <Text style={styles.welcome}>Welcome, {name}</Text>
        <Text style={styles.info}>Hall: {hall}</Text>
        <Text style={styles.info}>Type: {formatType(type)}</Text>
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
        placeholderTextColor={colors.subText}
        value={searchText}
        onChangeText={setSearchText}
      />

      <View style={styles.filterRow}>
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
              {capitalize(item)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        {viewMode === "my-tasks" ? "My Selected Complaints" : "Complaints"}
      </Text>

      {sortedComplaints.length === 0 ? (
        <Text style={styles.emptyText}>No complaints found.</Text>
      ) : (
        sortedComplaints.map((complaint) => {
          const overallState = getOverallComplaintState(complaint);
          const takenBySomeoneElse =
            complaint.assignedWorker && complaint.assignedWorker !== name;
          const takenByMe = complaint.assignedWorker === name;

          return (
            <View key={complaint.id} style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.cardType}>{formatType(complaint.type)}</Text>

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
                        : styles.pending,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {capitalize(overallState)}
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
              <Text style={styles.description}>{complaint.description}</Text>

              {complaint.roomNo && (
                <Text style={styles.detail}>Room No: {complaint.roomNo}</Text>
              )}

              {complaint.mobileNo && (
                <Text style={styles.detail}>Mobile: {complaint.mobileNo}</Text>
              )}

              <Text style={styles.detail}>Submitted By: {complaint.studentName}</Text>
              <Text style={styles.detail}>Roll: {complaint.roll}</Text>

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
                <Text style={styles.waitingText}>No worker has taken this complaint yet.</Text>
              )}

              {complaint.assignedAt && (
                <Text style={styles.detail}>
                  Taken Over At: {new Date(complaint.assignedAt).toLocaleString()}
                </Text>
              )}

              <Text style={styles.detail}>
                Worker Status: {complaint.workerStatus}
              </Text>

              <Text style={styles.detail}>
                Student Status: {complaint.studentStatus}
              </Text>

              {!complaint.assignedWorker && (
                <Pressable
                  style={styles.takeButton}
                  onPress={() => handleTakeComplaint(complaint.id)}
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
                    onPress={() => handleMarkCompleted(complaint.id)}
                  >
                    <Text style={styles.completeButtonText}>Mark Completed</Text>
                  </Pressable>
                )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function formatType(type) {
  if (type === "sports") return "Sports & Gym";
  if (type === "civil") return "Civil";
  if (type === "electricity") return "Electricity";
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
    backgroundColor: colors.white,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  welcome: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  info: {
    fontSize: 15,
    color: colors.subText,
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: "row",
    marginBottom: 14,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  activeToggle: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 13,
  },
  activeToggleText: {
    color: colors.white,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: colors.text,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  activeFilterText: {
    color: colors.white,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 16,
    color: colors.subText,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    backgroundColor: colors.secondary,
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
    color: colors.primary,
  },
  rightBadges: {
    alignItems: "flex-end",
    gap: 6,
  },
  detail: {
    fontSize: 14,
    color: colors.subText,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 8,
  },
  waitingText: {
    marginBottom: 6,
    fontSize: 13,
    color: "#6B7280",
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
    color: "#2563EB",
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
    color: "white",
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
    color: colors.white,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledTakeButton: {
    backgroundColor: "#9CA3AF",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  disabledTakeButtonText: {
    color: colors.white,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
  completeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  completeButtonText: {
    color: colors.white,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
});