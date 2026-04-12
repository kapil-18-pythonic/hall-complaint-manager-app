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

export default function WardenDashboard() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const hall = Array.isArray(params.hall) ? params.hall[0] : params.hall;

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
      const all = response?.complaints || [];

      const forwarded = all
        .filter(
          (item) =>
            normalizeText(item.hall) === normalizeText(hall) &&
            item.forwardedToWarden === true
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setComplaints(forwarded);
    } catch (error) {
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

  /* ================= UPDATED STATS ================= */

  const stats = useMemo(() => {
    const total = complaints.length;

    const pending = complaints.filter(
      (c) => getOverallComplaintState(c) === "pending"
    ).length;

    const conflict = complaints.filter(
      (c) => getOverallComplaintState(c) === "conflict"
    ).length;

    const completed = complaints.filter(
      (c) => getOverallComplaintState(c) === "completed"
    ).length;

    const highlighted = complaints.filter(
      (c) =>
        c.studentHighlighted ||
        c.councilHighlighted ||
        c.wardenEscalated
    ).length;

    const urgent = complaints.filter(
      (c) => c.priority === "urgent"
    ).length;

    return { total, pending, conflict, completed, highlighted, urgent };
  }, [complaints]);

  /* ================= FILTER ================= */

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
          item.priority,
        ].some((field) =>
          String(field || "")
            .toLowerCase()
            .includes(query)
        )
      );
    }

    if (activeFilter !== "total") {
      data = data.filter(
        (item) => getOverallComplaintState(item) === activeFilter
      );
    }

    return data;
  }, [complaints, searchText, activeFilter]);

  const openComplaintDetails = (complaint) => {
    router.push({
      pathname: "/warden/complaint-details",
      params: { id: complaint._id },
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F7BFF" />
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
    >
      <Text style={styles.heading}>Warden Dashboard</Text>

      <View style={styles.profileCard}>
        <Text style={styles.profileName}>
          Welcome, {name || "Warden"}
        </Text>
        <Text style={styles.profileText}>Hall: {hall}</Text>
      </View>

      <Text style={styles.sectionHeading}>Complaint Overview</Text>

      <View style={styles.statsGrid}>
        {renderStatCard("Total", stats.total, "total")}
        {renderStatCard("Pending", stats.pending, "pending")}
        {renderStatCard("Conflict", stats.conflict, "conflict")}
        {renderStatCard("Completed", stats.completed, "completed")}
        {renderStatCard("Highlighted", stats.highlighted, "highlighted")}
        {renderStatCard("Urgent", stats.urgent, "urgent")}
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

      {filteredComplaints.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No complaints available
          </Text>
        </View>
      ) : (
        filteredComplaints.map((complaint) => {
          const overallState = getOverallComplaintState(complaint);

          return (
            <Pressable
              key={complaint._id}
              style={[
                styles.complaintCard,
                complaint.wardenEscalated && styles.escalatedBorder,
              ]}
              onPress={() => openComplaintDetails(complaint)}
            >
              <Text style={styles.complaintTitle}>
                {complaint.title}
              </Text>

              <Text style={styles.complaintMeta}>
                Student: {complaint.studentName}
              </Text>

              <Text style={styles.complaintMeta}>
                Status: {capitalize(overallState)}
              </Text>

              <Text style={styles.complaintMeta}>
                Priority: {capitalize(complaint.priority)}
              </Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );

  function renderStatCard(label, value, filterKey) {
    const isActive = activeFilter === filterKey;

    return (
      <Pressable
        style={[styles.statCard, isActive && styles.activeStatCard]}
        onPress={() => setActiveFilter(filterKey)}
      >
        <Text style={styles.statNumber}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Pressable>
    );
  }
}

/* ================= HELPERS ================= */

function normalizeText(value) {
  return (value || "").trim().toLowerCase();
}

function getOverallComplaintState(complaint) {
  if (complaint.wardenEscalated) return "conflict";
  if (complaint.studentStatus === "completed") return "completed";
  if (complaint.workerStatus === "completed") return "conflict";
  return "pending";
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B123F" },
  contentContainer: { padding: 18, paddingBottom: 36 },

  centerContainer: {
    flex: 1,
    backgroundColor: "#0B123F",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: { marginTop: 12, color: "#C7D2FE" },

  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 18,
  },

  profileCard: {
    backgroundColor: "#141E61",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  profileName: {
    fontSize: 21,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  profileText: {
    fontSize: 15,
    color: "#A5B4FC",
    marginTop: 4,
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
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
  },

  activeStatCard: {
    backgroundColor: "#1C2B8F",
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  statLabel: {
    fontSize: 14,
    color: "#A5B4FC",
    marginTop: 4,
  },

  searchCard: {
    backgroundColor: "#141E61",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },

  searchInput: { color: "#FFFFFF" },

  emptyCard: {
    backgroundColor: "#141E61",
    padding: 24,
    borderRadius: 18,
    alignItems: "center",
  },

  emptyTitle: { color: "#FFFFFF", fontWeight: "800" },

  complaintCard: {
    backgroundColor: "#141E61",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },

  escalatedBorder: {
    borderWidth: 2,
    borderColor: "#FF4D4F",
  },

  complaintTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  complaintMeta: {
    fontSize: 14,
    color: "#A5B4FC",
    marginTop: 4,
  },
});