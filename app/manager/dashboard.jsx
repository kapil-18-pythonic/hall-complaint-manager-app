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

const BASE_URL = "[hall-complaint-manager.onrender.com](https://hall-complaint-manager.onrender.com)";

export default function ManagerDashboard() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const hall = Array.isArray(params.hall) ? params.hall[0] : params.hall;

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    fetchComplaints();
  }, [hall]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${BASE_URL}/api/complaints/hall/${hall}`
      );
      const data = await response.json();

      if (data.success) {
        setComplaints(data.complaints);
      }
    } catch (error) {
      console.log("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints();
  };

  const stats = useMemo(() => {
    return {
      total: complaints.length,
      low: complaints.filter((c) => c.priority === "low").length,
      medium: complaints.filter((c) => c.priority === "medium").length,
      high: complaints.filter((c) => c.priority === "high").length,
      urgent: complaints.filter((c) => c.priority === "urgent").length,
    };
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    let data = [...complaints];

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      data = data.filter((c) =>
        [c.title, c.description, c.category]
          .some((f) => String(f || "").toLowerCase().includes(q))
      );
    }

    if (priorityFilter !== "all") {
      data = data.filter((c) => c.priority === priorityFilter);
    }

    return data;
  }, [complaints, searchText, priorityFilter]);

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return styles.urgentBadge;
      case "high":
        return styles.highBadge;
      case "medium":
        return styles.mediumBadge;
      case "low":
        return styles.lowBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const renderStatCard = (label, value, key) => {
    const isActive = priorityFilter === key;

    return (
      <Pressable
        onPress={() => setPriorityFilter(key)}
        style={[styles.statCard, isActive && styles.activeStatCard]}
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

  const handleOpenComplaint = (item) => {
    router.push({
      pathname: "/manager/complaint-details",
      params: { id: item._id },
    });
  };

  const capitalize = (value) => {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
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
      <Text style={styles.heading}>Manager Dashboard</Text>

      {/* PROFILE */}
      <View style={styles.profileCard}>
        <Text style={styles.profileName}>Welcome, {name || "Manager"}</Text>
        <Text style={styles.profileText}>Hall: {hall || "Not Available"}</Text>
        <Text style={styles.profileText}>Role: Hall Manager</Text>
      </View>

      {/* MANAGE MEMBERS BUTTON */}
      <Pressable
        style={styles.manageButton}
        onPress={() =>
          router.push({
            pathname: "/manager/manage-members",
            params: { hall },
          })
        }
      >
        <Text style={styles.buttonText}>Manage Members</Text>
      </Pressable>

      {/* STATS */}
      <Text style={styles.sectionHeading}>Priority Overview</Text>

      <View style={styles.statsGrid}>
        {renderStatCard("All", stats.total, "all")}
        {renderStatCard("Low", stats.low, "low")}
        {renderStatCard("Medium", stats.medium, "medium")}
        {renderStatCard("High", stats.high, "high")}
        {renderStatCard("Urgent", stats.urgent, "urgent")}
      </View>

      {/* SEARCH */}
      <View style={styles.searchCard}>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search complaints..."
          placeholderTextColor="#8A94B2"
          style={styles.searchInput}
        />
      </View>

      {/* FILTER ROW */}
      <View style={styles.filterRow}>
        <Text style={styles.filterText}>
          Showing: {priorityFilter === "all" ? "All Complaints" : capitalize(priorityFilter) + " Priority"}
        </Text>
        {priorityFilter !== "all" ? (
          <Pressable onPress={() => setPriorityFilter("all")}>
            <Text style={styles.clearFilterText}>Clear Filter</Text>
          </Pressable>
        ) : null}
      </View>

      {/* LIST */}
      <Text style={styles.sectionHeading}>Hall Complaints</Text>

      {filteredComplaints.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No complaints found.</Text>
        </View>
      ) : (
        filteredComplaints.map((item) => (
          <Pressable
            key={item._id}
            style={styles.complaintCard}
            onPress={() => handleOpenComplaint(item)}
          >
            <View style={styles.complaintTopRow}>
              <Text style={styles.complaintType}>
                {capitalize(item.category) || "Other"}
              </Text>

              <View style={[styles.priorityBadge, getPriorityStyle(item.priority)]}>
                <Text style={styles.priorityBadgeText}>
                  {item.priority?.toUpperCase() || "N/A"}
                </Text>
              </View>
            </View>

            <Text style={styles.complaintTitle}>{item.title}</Text>
            <Text numberOfLines={2} style={styles.complaintDescription}>
              {item.description}
            </Text>

            {item.roomNo && (
              <Text style={styles.complaintMeta}>Room: {item.roomNo}</Text>
            )}
            {item.studentName && (
              <Text style={styles.complaintMeta}>Student: {item.studentName}</Text>
            )}
            {item.status && (
              <Text style={styles.complaintMeta}>Status: {capitalize(item.status)}</Text>
            )}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B123F",
    paddingTop: 16,
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
    marginBottom: 18,
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

  manageButton: {
    backgroundColor: "#3A57E8",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#4F7BFF",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
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

  searchCard: {
    backgroundColor: "#141E61",
    borderWidth: 1,
    borderColor: "#2F3DBB",
    borderRadius: 16,
    padding: 14,
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

  priorityBadge: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  urgentBadge: {
    backgroundColor: "#EF4444",
  },

  highBadge: {
    backgroundColor: "#F59E0B",
  },

  mediumBadge: {
    backgroundColor: "#3B82F6",
  },

  lowBadge: {
    backgroundColor: "#10B981",
  },

  defaultBadge: {
    backgroundColor: "#6B7280",
  },

  priorityBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
});
