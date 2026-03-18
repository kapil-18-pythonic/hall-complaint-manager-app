import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors } from "../../src/constants/colors";
import {
  getComplaints,
  getOverallComplaintState,
  searchAndFilterComplaints,
  priorityRank,
} from "../../src/store/complaintsStore";

export default function CouncilDashboard() {
  const { name, hall, role } = useLocalSearchParams();

  const [searchText, setSearchText] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [viewMode, setViewMode] = useState("active");

  const allComplaints = getComplaints();

  let allowedTypes = [];

  if (role === "GSec Maintenance") {
    allowedTypes = ["civil", "electricity"];
  }

  if (role === "GSec Sports") {
    allowedTypes = ["sports"];
  }

  if (role === "GSec Mess") {
    allowedTypes = ["mess"];
  }

  const councilComplaints = allComplaints.filter(
    (complaint) =>
      complaint.hall === hall && allowedTypes.includes(complaint.type)
  );

  const activeComplaints = councilComplaints.filter((complaint) => {
    const overallState = getOverallComplaintState(complaint);

    if (complaint.type === "mess") {
      return true;
    }

    return overallState !== "completed";
  });

  const historyComplaints = councilComplaints.filter((complaint) => {
    if (complaint.type === "mess") return false;
    return getOverallComplaintState(complaint) === "completed";
  });

  const complaintsToShow =
    viewMode === "history" ? historyComplaints : activeComplaints;

  const filteredComplaints = useMemo(() => {
    return searchAndFilterComplaints({
      complaintsList: complaintsToShow,
      searchText,
      state: stateFilter,
    });
  }, [complaintsToShow, searchText, stateFilter]);

  const sortedComplaints = [...filteredComplaints].sort(
    (a, b) => priorityRank(a.priority || "medium") - priorityRank(b.priority || "medium")
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Hall Council Dashboard</Text>

      <View style={styles.profileCard}>
        <Text style={styles.welcome}>Welcome, {name}</Text>
        <Text style={styles.info}>Hall: {hall}</Text>
        <Text style={styles.info}>Role: {role}</Text>
      </View>

      <View style={styles.toggleRow}>
        <Pressable
          style={[
            styles.toggleButton,
            viewMode === "active" && styles.activeToggle,
          ]}
          onPress={() => setViewMode("active")}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === "active" && styles.activeToggleText,
            ]}
          >
            Active Complaints
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.toggleButton,
            viewMode === "history" && styles.activeToggle,
          ]}
          onPress={() => setViewMode("history")}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === "history" && styles.activeToggleText,
            ]}
          >
            History
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
        {viewMode === "history" ? "Complaint History" : "Hall Complaints"}
      </Text>

      {sortedComplaints.length === 0 ? (
        <Text style={styles.emptyText}>No complaints available.</Text>
      ) : (
        sortedComplaints.map((complaint) => {
          const overallState = getOverallComplaintState(complaint);

          return (
            <View key={complaint.id} style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.type}>{formatType(complaint.type)}</Text>

                <View style={styles.rightBadges}>
                  {complaint.type !== "mess" && (
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
                  )}

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
                <Text style={styles.detail}>Room: {complaint.roomNo}</Text>
              )}

              {complaint.mobileNo && (
                <Text style={styles.detail}>Mobile: {complaint.mobileNo}</Text>
              )}

              {complaint.type !== "mess" && complaint.studentName && (
                <Text style={styles.detail}>Student: {complaint.studentName}</Text>
              )}

              {complaint.type !== "mess" && complaint.roll && (
                <Text style={styles.detail}>Roll No: {complaint.roll}</Text>
              )}

              {complaint.type !== "mess" && complaint.assignedWorker && (
                <Text style={styles.assignedText}>
                  Assigned Worker: {complaint.assignedWorker}
                </Text>
              )}

              {complaint.type !== "mess" && (
                <>
                  <Text style={styles.detail}>
                    Worker Status: {complaint.workerStatus}
                  </Text>
                  <Text style={styles.detail}>
                    Student Status: {complaint.studentStatus}
                  </Text>
                </>
              )}

              {complaint.assignedAt && complaint.type !== "mess" && (
                <Text style={styles.detail}>
                  Taken At: {new Date(complaint.assignedAt).toLocaleString()}
                </Text>
              )}

              {complaint.workerCompletedAt && complaint.type !== "mess" && (
                <Text style={styles.detail}>
                  Worker Completed:{" "}
                  {new Date(complaint.workerCompletedAt).toLocaleString()}
                </Text>
              )}

              {complaint.completedAt && complaint.type !== "mess" && (
                <Text style={styles.detail}>
                  Final Completion:{" "}
                  {new Date(complaint.completedAt).toLocaleString()}
                </Text>
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
  if (type === "mess") return "Mess";
  return type;
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
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
    marginBottom: 8,
  },
  type: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  rightBadges: {
    alignItems: "flex-end",
    gap: 6,
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
  detail: {
    fontSize: 14,
    color: colors.subText,
    marginBottom: 4,
  },
  assignedText: {
    marginBottom: 6,
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "700",
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
});