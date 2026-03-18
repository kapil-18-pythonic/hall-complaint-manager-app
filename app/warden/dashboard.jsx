import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors } from "../../src/constants/colors";
import { getComplaints } from "../../src/store/complaintsStore";

export default function WardenDashboard() {
  const { name, hall, designation } = useLocalSearchParams();

  const allComplaints = getComplaints();

  const hallComplaints = allComplaints.filter(
    (complaint) => complaint.hall === hall
  );

  const totalComplaints = hallComplaints.length;

  const pendingComplaints = hallComplaints.filter((complaint) => {
    if (complaint.type === "mess") return false;

    return (
      complaint.workerStatus === "pending" &&
      complaint.studentStatus === "pending"
    );
  }).length;

  const completedComplaints = hallComplaints.filter((complaint) => {
    if (complaint.type === "mess") return false;

    return (
      complaint.workerStatus === "completed" &&
      complaint.studentStatus === "completed"
    );
  }).length;

  const conflictComplaints = hallComplaints.filter((complaint) => {
    if (complaint.type === "mess") return false;

    return (
      complaint.workerStatus === "completed" &&
      complaint.studentStatus === "pending"
    );
  }).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Warden Dashboard</Text>

      <View style={styles.profileCard}>
        <Text style={styles.welcome}>Welcome, {name}</Text>
        <Text style={styles.info}>Hall: {hall}</Text>
        <Text style={styles.info}>Designation: {designation}</Text>
      </View>

      <Text style={styles.sectionTitle}>Complaint Overview</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalComplaints}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>
            {pendingComplaints}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#10B981" }]}>
            {completedComplaints}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#EF4444" }]}>
            {conflictComplaints}
          </Text>
          <Text style={styles.statLabel}>Conflicts</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Hall Complaints</Text>

      {hallComplaints.length === 0 ? (
        <Text style={styles.emptyText}>No complaints available.</Text>
      ) : (
        hallComplaints.map((complaint) => {
          const isConflict =
            complaint.workerStatus === "completed" &&
            complaint.studentStatus === "pending";

          const isCompleted =
            complaint.workerStatus === "completed" &&
            complaint.studentStatus === "completed";

          return (
            <View key={complaint.id} style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.type}>{formatType(complaint.type)}</Text>

                {complaint.type !== "mess" && (
                  <View
                    style={[
                      styles.statusBadge,
                      isConflict
                        ? styles.conflict
                        : isCompleted
                        ? styles.completed
                        : styles.pending,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {isConflict
                        ? "Conflict"
                        : isCompleted
                        ? "Completed"
                        : "Pending"}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.title}>{complaint.title}</Text>
              <Text style={styles.description}>{complaint.description}</Text>

              {complaint.roomNo && (
                <Text style={styles.detail}>Room: {complaint.roomNo}</Text>
              )}

              {complaint.mobileNo && (
                <Text style={styles.detail}>Mobile: {complaint.mobileNo}</Text>
              )}

              {complaint.type !== "mess" && (
                <>
                  <Text style={styles.detail}>
                    Student: {complaint.studentName}
                  </Text>
                  <Text style={styles.detail}>Roll: {complaint.roll}</Text>
                  <Text style={styles.detail}>
                    Worker Status: {complaint.workerStatus}
                  </Text>
                  <Text style={styles.detail}>
                    Student Status: {complaint.studentStatus}
                  </Text>
                </>
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
    marginBottom: 24,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.subText,
    fontWeight: "600",
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
    alignItems: "center",
    marginBottom: 8,
  },
  type: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
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
  statusBadge: {
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
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
});