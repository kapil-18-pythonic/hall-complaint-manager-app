import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { getComplaintsByHall } from "../../src/services/api";

export default function WardenDashboard() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const hall = Array.isArray(params.hall) ? params.hall[0] : params.hall;
  const designation = Array.isArray(params.designation)
    ? params.designation[0]
    : params.designation;

  const [activeFilter, setActiveFilter] = useState("total");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const sortComplaintsWithOtherFirst = (items = []) => {
    return [...items].sort((a, b) => {
      if (a.category === "other" && b.category !== "other") return -1;
      if (a.category !== "other" && b.category === "other") return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const loadComplaints = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const response = await getComplaintsByHall(hall);

      if (response.success) {
        setComplaints(sortComplaintsWithOtherFirst(response.complaints || []));
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
    }, [hall])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadComplaints(false);
  };

  const totalComplaints = complaints.length;

  const pendingComplaints = complaints.filter(
    (complaint) => getOverallComplaintState(complaint) === "pending"
  ).length;

  const completedComplaints = complaints.filter(
    (complaint) => getOverallComplaintState(complaint) === "completed"
  ).length;

  const conflictComplaints = complaints.filter(
    (complaint) => getOverallComplaintState(complaint) === "conflict"
  ).length;

  const filteredComplaints = useMemo(() => {
    if (activeFilter === "total") return complaints;

    if (activeFilter === "pending") {
      return complaints.filter(
        (complaint) => getOverallComplaintState(complaint) === "pending"
      );
    }

    if (activeFilter === "completed") {
      return complaints.filter(
        (complaint) => getOverallComplaintState(complaint) === "completed"
      );
    }

    if (activeFilter === "conflicts") {
      return complaints.filter(
        (complaint) => getOverallComplaintState(complaint) === "conflict"
      );
    }

    return complaints;
  }, [activeFilter, complaints]);

  const openComplaintDetails = (complaint) => {
    router.push({
      pathname: "/warden/complaint-details",
      params: {
        id: complaint._id,
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
      <Text style={styles.heading}>Warden Dashboard</Text>

      <View style={styles.profileCard}>
        <Text style={styles.welcome}>Welcome, {name || "Warden"}</Text>
        <Text style={styles.info}>Hall: {hall || "Not Assigned"}</Text>
        <Text style={styles.info}>
          Designation: {designation || "Warden"}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Complaint Overview</Text>

      <View style={styles.statsGrid}>
        <Pressable
          style={[
            styles.statCard,
            activeFilter === "total" && styles.activeStatCard,
          ]}
          onPress={() => setActiveFilter("total")}
        >
          <Text style={styles.statValue}>{totalComplaints}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </Pressable>

        <Pressable
          style={[
            styles.statCard,
            activeFilter === "pending" && styles.activeStatCard,
          ]}
          onPress={() => setActiveFilter("pending")}
        >
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>
            {pendingComplaints}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </Pressable>

        <Pressable
          style={[
            styles.statCard,
            activeFilter === "completed" && styles.activeStatCard,
          ]}
          onPress={() => setActiveFilter("completed")}
        >
          <Text style={[styles.statValue, { color: "#10B981" }]}>
            {completedComplaints}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </Pressable>

        <Pressable
          style={[
            styles.statCard,
            activeFilter === "conflicts" && styles.activeStatCard,
          ]}
          onPress={() => setActiveFilter("conflicts")}
        >
          <Text style={[styles.statValue, { color: "#EF4444" }]}>
            {conflictComplaints}
          </Text>
          <Text style={styles.statLabel}>Conflicts</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>
        {activeFilter === "total"
          ? "All Complaints"
          : activeFilter === "pending"
          ? "Pending Complaints"
          : activeFilter === "completed"
          ? "Completed Complaints"
          : "Conflict Complaints"}
      </Text>

      {loading ? (
        <Text style={styles.emptyText}>Loading complaints...</Text>
      ) : filteredComplaints.length === 0 ? (
        <Text style={styles.emptyText}>No complaints available.</Text>
      ) : (
        filteredComplaints.map((complaint) => {
          const overallState = getOverallComplaintState(complaint);

          return (
            <Pressable
              key={complaint._id}
              style={styles.card}
              onPress={() => openComplaintDetails(complaint)}
            >
              <View style={styles.topRow}>
                <Text style={styles.type}>{formatType(complaint.category)}</Text>

                <View
                  style={[
                    styles.statusBadge,
                    overallState === "completed"
                      ? styles.completed
                      : overallState === "conflict"
                      ? styles.conflict
                      : overallState === "escalated"
                      ? styles.escalated
                      : overallState === "open"
                      ? styles.open
                      : styles.pending,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {formatState(overallState)}
                  </Text>
                </View>
              </View>

              <Text style={styles.title}>{complaint.title}</Text>

              <Text style={styles.description} numberOfLines={2}>
                {complaint.description}
              </Text>

              <Text style={styles.detail}>
                Student: {complaint.studentName || "Not Available"}
              </Text>

              <Text style={styles.detail}>
                Priority: {capitalize(complaint.priority || "medium")}
              </Text>

              <Text style={styles.viewMore}>Tap to view full details</Text>
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
  if (type === "sports") return "Sports";
  if (type === "gym") return "Gym";
  if (type === "civil") return "Civil";
  if (type === "electricity") return "Electricity";
  if (type === "mess") return "Mess";
  if (type === "other") return "Other";
  return type;
}

function formatState(state) {
  if (state === "completed") return "Completed";
  if (state === "conflict") return "Conflict";
  if (state === "escalated") return "Escalated";
  if (state === "open") return "Open";
  return "Pending";
}

function capitalize(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
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
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: "#141D6B",
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F5F7FF",
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
    backgroundColor: "#141D6B",
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  activeStatCard: {
    backgroundColor: "#1E2D8F",
    borderColor: "#4A63FF",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F5F7FF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#D7DBF5",
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 16,
    color: "#AEB8E8",
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
    alignItems: "center",
    marginBottom: 8,
  },
  type: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8FA8FF",
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
  detail: {
    fontSize: 14,
    color: "#AEB8E8",
    marginBottom: 4,
  },
  viewMore: {
    marginTop: 8,
    fontSize: 13,
    color: "#8FA8FF",
    fontWeight: "700",
  },
  statusBadge: {
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
    backgroundColor: "#8B5CF6",
  },
  open: {
    backgroundColor: "#3B82F6",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});