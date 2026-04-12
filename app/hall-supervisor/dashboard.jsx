import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAllComplaints } from "../../src/services/api";

export default function HallSupervisorDashboard() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const hall = Array.isArray(params.hall) ? params.hall[0] : params.hall;
  const por = Array.isArray(params.por) ? params.por[0] : params.por;
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState("total");

  useEffect(() => {
    loadComplaints();
  }, [hall]);

  const loadComplaints = async () => {
    try {
      setLoading(true);

      const response = await getAllComplaints();
      const allComplaints = response?.complaints || [];

      const hallComplaints = allComplaints
        .filter((item) => normalizeText(item.hall) === normalizeText(hall))
        .map((item) => ({
          ...item,
          category: normalizeCategory(item.category),
        }));

      hallComplaints.sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      setComplaints(hallComplaints);
    } catch (error) {
      console.log("Failed to load complaints:", error.message);
      setComplaints([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadComplaints();
  };

  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter(
      (item) => getOverallComplaintState(item) === "pending"
    ).length;
    const completed = complaints.filter(
      (item) => getOverallComplaintState(item) === "completed"
    ).length;
    const conflicts = complaints.filter(
      (item) => getOverallComplaintState(item) === "conflict"
    ).length;

    return { total, pending, completed, conflicts };
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    let data = [...complaints];

    if (searchText.trim()) {
      const query = searchText.toLowerCase();

      data = data.filter((item) =>
        [
          item.title,
          item.description,
          item.studentName,
          item.rollNumber,
          item.roomNo,
          item.mobileNo,
          item.category,
          item.assignedWorker,
          item.priority,
        ].some((field) =>
          String(field || "")
            .toLowerCase()
            .includes(query)
        )
      );
    }

    if (activeFilter === "pending") {
      data = data.filter((item) => getOverallComplaintState(item) === "pending");
    } else if (activeFilter === "completed") {
      data = data.filter((item) => getOverallComplaintState(item) === "completed");
    } else if (activeFilter === "conflicts") {
      data = data.filter((item) => getOverallComplaintState(item) === "conflict");
    }

    return data;
  }, [complaints, searchText, activeFilter]);

  const handleOpenComplaint = (complaint) => {
    router.push({
      pathname: "/hall-supervisor/complaint-details",
      params: {
        id: complaint._id || complaint.id,
        hall: hall || complaint.hall,
        name,
        por,
        email,
      },
    });
  };

  const renderStatCard = (label, value, key, colorStyle) => {
    const isActive = activeFilter === key;

    return (
      <Pressable
        onPress={() => setActiveFilter(key)}
        style={[styles.statCard, colorStyle, isActive && styles.activeStatCard]}
      >
        <Text style={[styles.statNumber, isActive && styles.activeStatText]}>
          {value}
        </Text>
        <Text style={[styles.statLabel, isActive && styles.activeStatText]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2B6CFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Hall Supervisor Dashboard</Text>

      <View style={styles.profileCard}>
        <Text style={styles.profileName}>Welcome, {name || "Supervisor"}</Text>
        <Text style={styles.profileText}>Hall: {hall || "Not Available"}</Text>
        <Text style={styles.profileText}>
          Role: {por || "Hall Supervisor"}
        </Text>
      </View>

      <Text style={styles.sectionHeading}>Complaint Overview</Text>

      <View style={styles.statsGrid}>
        {renderStatCard("Total", stats.total, "total", styles.totalCard)}
        {renderStatCard("Pending", stats.pending, "pending", styles.pendingCard)}
        {renderStatCard(
          "Completed",
          stats.completed,
          "completed",
          styles.completedCard
        )}
        {renderStatCard(
          "Conflicts",
          stats.conflicts,
          "conflicts",
          styles.conflictsCard
        )}
      </View>

      <View style={styles.searchCard}>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search complaints..."
          placeholderTextColor="#8A94B2"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterText}>
          Showing: {capitalize(activeFilter === "total" ? "all complaints" : activeFilter)}
        </Text>
        {activeFilter !== "total" ? (
          <Pressable onPress={() => setActiveFilter("total")}>
            <Text style={styles.clearFilterText}>Clear Filter</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.sectionHeading}>Hall Complaints</Text>

      {filteredComplaints.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No complaints found.</Text>
        </View>
      ) : (
        filteredComplaints.map((complaint) => {
          const overallState = getOverallComplaintState(complaint);

          return (
            <Pressable
              key={complaint._id || complaint.id}
              style={styles.complaintCard}
              onPress={() => handleOpenComplaint(complaint)}
            >
              <View style={styles.complaintTopRow}>
                <Text style={styles.complaintType}>
                  {formatType(complaint.category)}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    overallState === "completed"
                      ? styles.completedBadge
                      : overallState === "conflict"
                      ? styles.conflictBadge
                      : overallState === "open"
                      ? styles.openBadge
                      : styles.pendingBadge,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {capitalize(overallState)}
                  </Text>
                </View>
              </View>

              <Text style={styles.complaintTitle}>{complaint.title}</Text>
              <Text style={styles.complaintDescription} numberOfLines={2}>
                {complaint.description}
              </Text>

              <Text style={styles.complaintMeta}>
                Room: {complaint.roomNo || "Not Provided"}
              </Text>
              <Text style={styles.complaintMeta}>
                Mobile: {complaint.mobileNo || "Not Provided"}
              </Text>
              <Text style={styles.complaintMeta}>
                Student: {complaint.studentName || "Not Available"}
              </Text>
              <Text style={styles.complaintMeta}>
                Roll: {complaint.rollNumber || "Not Available"}
              </Text>
              <Text style={styles.complaintMeta}>
                Worker: {complaint.assignedWorker || "Not Assigned"}
              </Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

function normalizeCategory(category) {
  return (category || "").trim().toLowerCase();
}

function normalizeText(value) {
  return (value || "").trim().toLowerCase();
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
  const normalized = normalizeCategory(type);
  if (normalized === "sports") return "Sports";
  if (normalized === "gym") return "Gym";
  if (normalized === "civil") return "Civil";
  if (normalized === "electricity") return "Electricity";
  if (normalized === "mess") return "Mess";
  return capitalize(normalized || "Other");
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B123F",
    paddingTop:16,
  },

  contentContainer: {
    padding: 18,
    paddingBottom: 36,
  },

  centerContainer: {
    flex: 1,
    backgroundColor: "#0B123F",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#C7D2FE",
    fontWeight: "600",
  },

  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 18,
  },

  profileCard: {
    backgroundColor: "#141E61",
    borderWidth: 1,
    borderColor: "#2F3DBB",
    borderRadius: 20,
    padding: 20,
    marginBottom: 22,
  },

  profileName: {
    fontSize: 21,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 10,
  },

  profileText: {
    fontSize: 15,
    color: "#A5B4FC",
    marginBottom: 4,
    fontWeight: "500",
  },

  sectionHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E0E7FF",
    marginBottom: 14,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#141E61",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2F3DBB",
  },

  activeStatCard: {
    borderWidth: 2,
    borderColor: "#4F7BFF",
    backgroundColor: "#1C2B8F",
  },

  statNumber: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
    color: "#FFFFFF",
  },

  statLabel: {
    fontSize: 14,
    color: "#A5B4FC",
    fontWeight: "700",
  },

  activeStatText: {
    color: "#FFFFFF",
  },

  totalCard: {},
  pendingCard: {},
  completedCard: {},
  conflictsCard: {},

  searchCard: {
    backgroundColor: "#141E61",
    borderWidth: 1,
    borderColor: "#2F3DBB",
    borderRadius: 16,
    padding: 10,
    marginBottom: 14,
  },

  searchInput: {
    fontSize: 15,
    color: "#FFFFFF",
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  filterText: {
    fontSize: 14,
    color: "#A5B4FC",
    fontWeight: "700",
  },

  clearFilterText: {
    fontSize: 14,
    color: "#4F7BFF",
    fontWeight: "800",
  },

  emptyCard: {
    backgroundColor: "#141E61",
    borderWidth: 1,
    borderColor: "#2F3DBB",
    borderRadius: 18,
    padding: 20,
  },

  emptyText: {
    fontSize: 15,
    color: "#C7D2FE",
    fontWeight: "600",
    textAlign: "center",
  },

  complaintCard: {
    backgroundColor: "#141E61",
    borderWidth: 1,
    borderColor: "#2F3DBB",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },

  complaintTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  complaintType: {
    fontSize: 15,
    fontWeight: "800",
    color: "#4F7BFF",
    flex: 1,
    marginRight: 10,
  },

  complaintTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },

  complaintDescription: {
    fontSize: 15,
    color: "#C7D2FE",
    lineHeight: 22,
    marginBottom: 10,
  },

  complaintMeta: {
    fontSize: 14,
    color: "#A5B4FC",
    marginBottom: 4,
    fontWeight: "500",
  },

  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  pendingBadge: {
    backgroundColor: "#F59E0B",
  },

  completedBadge: {
    backgroundColor: "#10B981",
  },

  conflictBadge: {
    backgroundColor: "#EF4444",
  },

  openBadge: {
    backgroundColor: "#3B82F6",
  },

  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
});