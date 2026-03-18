import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  getComplaints,
  confirmComplaintResolvedByStudent,
  getOverallComplaintState,
} from "../../src/store/complaintsStore";
import { colors } from "../../src/constants/colors";

export default function MyComplaints() {
  const { name, roll, hall } = useLocalSearchParams();

  const allComplaints = getComplaints();

  const visibleComplaints = allComplaints.filter((complaint) => {
    if (complaint.type === "mess") {
      return complaint.hall === hall;
    }

    return complaint.roll === roll && complaint.studentName === name;
  });

  const activeComplaints = visibleComplaints.filter(
    (complaint) => getOverallComplaintState(complaint) !== "completed"
  );

  const historyComplaints = visibleComplaints.filter(
    (complaint) => getOverallComplaintState(complaint) === "completed"
  );

  const handleConfirmResolved = (id) => {
    confirmComplaintResolvedByStudent(id);
    Alert.alert("Updated", "Complaint confirmed as resolved.");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>My Complaints</Text>

      <Text style={styles.sectionTitle}>Active Complaints</Text>
      {activeComplaints.length === 0 ? (
        <Text style={styles.emptyText}>No active complaints.</Text>
      ) : (
        activeComplaints.map((complaint) => {
          const overallState = getOverallComplaintState(complaint);

          return (
            <View key={complaint.id} style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.type}>{formatType(complaint.type)}</Text>

                {complaint.type !== "mess" && (
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
                )}
              </View>

              <Text style={styles.title}>{complaint.title}</Text>
              <Text style={styles.description}>{complaint.description}</Text>

              {complaint.assignedWorker && complaint.type !== "mess" ? (
                <Text style={styles.assignedText}>
                  Assigned Worker: {complaint.assignedWorker}
                </Text>
              ) : complaint.type !== "mess" ? (
                <Text style={styles.waitingText}>Waiting for worker to take over.</Text>
              ) : null}

              {complaint.assignedAt && complaint.type !== "mess" && (
                <Text style={styles.detail}>
                  Taken Over At: {new Date(complaint.assignedAt).toLocaleString()}
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

              {complaint.type !== "mess" && overallState === "conflict" && (
                <Pressable
                  style={styles.confirmButton}
                  onPress={() => handleConfirmResolved(complaint.id)}
                >
                  <Text style={styles.confirmButtonText}>Confirm Resolved</Text>
                </Pressable>
              )}
            </View>
          );
        })
      )}

      <Text style={styles.sectionTitle}>Complaint History</Text>
      {historyComplaints.length === 0 ? (
        <Text style={styles.emptyText}>No resolved complaint history yet.</Text>
      ) : (
        historyComplaints.map((complaint) => (
          <View key={complaint.id} style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.type}>{formatType(complaint.type)}</Text>

              {complaint.type !== "mess" && (
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

            {complaint.assignedWorker && complaint.type !== "mess" && (
              <Text style={styles.assignedText}>
                Assigned Worker: {complaint.assignedWorker}
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
        ))
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
    padding: 20,
    paddingTop: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 14,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.subText,
    marginBottom: 18,
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
  waitingText: {
    marginBottom: 6,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
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
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  confirmButtonText: {
    color: colors.white,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
});