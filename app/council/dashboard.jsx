import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { getCouncilComplaints } from "../../src/services/api";

export default function CouncilDashboard() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const hall = Array.isArray(params.hall) ? params.hall[0] : params.hall;

  const porParam = Array.isArray(params.por) ? params.por[0] : params.por;
  const roleParam = Array.isArray(params.role) ? params.role[0] : params.role;

  const councilPor = normalizePor(porParam || roleParam || "");

  const [searchText, setSearchText] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [viewMode, setViewMode] = useState("active");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const allowedCategories = useMemo(() => {
    return getAllowedCategoriesByPor(councilPor);
  }, [councilPor]);

  const loadComplaints = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const response = await getCouncilComplaints(hall, councilPor);

      if (response?.success) {
        const allComplaints = Array.isArray(response.complaints)
          ? response.complaints
          : [];

        const porFilteredComplaints = allComplaints.filter((complaint) => {
          const category = normalizeCategory(
            complaint.category || complaint.type
          );

          if (allowedCategories.length === 0) return true;
          return allowedCategories.includes(category);
        });

        setComplaints(porFilteredComplaints);
      } else {
        setComplaints([]);
        Alert.alert("Error", response?.message || "Failed to load complaints");
      }
    } catch (error) {
      setComplaints([]);
      Alert.alert("Error", error.message || "Failed to load complaints");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (hall) {
      loadComplaints();
    } else {
      setLoading(false);
    }
  }, [hall, councilPor]);

  useFocusEffect(
    useCallback(() => {
      if (hall) {
        loadComplaints(false);
      }
    }, [hall, councilPor])
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

  const complaintsToShow =
    viewMode === "history" ? historyComplaints : activeComplaints;

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
        complaint.type?.toLowerCase().includes(text) ||
        complaint.studentName?.toLowerCase().includes(text) ||
        complaint.rollNumber?.toLowerCase().includes(text) ||
        complaint.roll?.toLowerCase().includes(text) ||
        complaint.assignedWorker?.toLowerCase().includes(text) ||
        complaint.assignedWorkerId?.toLowerCase().includes(text) ||
        complaint.workerId?.toLowerCase().includes(text);

      const matchesState =
        stateFilter === "all" ||
        overallState === stateFilter ||
        (stateFilter === "pending" &&
          (overallState === "open" || overallState === "pending"));

      return matchesSearch && matchesState;
    });
  }, [complaintsToShow, searchText, stateFilter]);

  const sortedComplaints = useMemo(() => {
    return [...filteredComplaints].sort((a, b) => {
      const aCategory = normalizeCategory(a.category || a.type);
      const bCategory = normalizeCategory(b.category || b.type);

      if (aCategory === "other" && bCategory !== "other") return -1;
      if (aCategory !== "other" && bCategory === "other") return 1;

      return (
        priorityRank(a.priority || "medium") -
        priorityRank(b.priority || "medium")
      );
    });
  }, [filteredComplaints]);

  const counts = useMemo(() => {
    const sourceList =
      viewMode === "history" ? historyComplaints : activeComplaints;

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
  }, [viewMode, activeComplaints, historyComplaints]);

  const openComplaintDetails = (complaint) => {
    router.push({
      pathname: "/council/complaint-details",
      params: {
        id: complaint._id || complaint.id,
        por: councilPor,
        role: councilPor,
        hall,
        name,
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
      <Text style={styles.heading}>{hall || "Hall"} Council Dashboard</Text>

      <View style={styles.profileCard}>
        <Text style={styles.welcome}>Welcome, {name || "Council Member"}</Text>
        <Text style={styles.info}>Hall: {hall || "Not Assigned"}</Text>
        <Text style={styles.info}>POR: {councilPor || "Not Assigned"}</Text>
        <Text style={styles.info}>
          Complaint Types: {getComplaintTypeLabel(councilPor)}
        </Text>
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
        {viewMode === "history" ? "Complaint History" : "Hall Complaints"}
      </Text>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#4A63FF" />
          <Text style={styles.emptyText}>Loading complaints...</Text>
        </View>
      ) : sortedComplaints.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No complaints available.</Text>
          <Text style={styles.emptySubText}>
            Pull to refresh or check if complaints exist for this hall.
          </Text>
        </View>
      ) : (
        sortedComplaints.map((complaint) => {
          const overallState = getOverallComplaintState(complaint);
          const shownWorkerId =
            complaint.assignedWorkerId || complaint.workerId || "";

          return (
            <Pressable
              key={complaint._id || complaint.id}
              style={styles.card}
              onPress={() => openComplaintDetails(complaint)}
            >
              <View style={styles.topRow}>
                <Text style={styles.type}>
                  {formatType(complaint.category || complaint.type)}
                </Text>

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

              <Text style={styles.description} numberOfLines={2}>
                {complaint.description}
              </Text>

              {complaint.roomNo ? (
                <Text style={styles.detail}>Room: {complaint.roomNo}</Text>
              ) : null}

              {complaint.mobileNo ? (
                <Text style={styles.detail}>Mobile: {complaint.mobileNo}</Text>
              ) : null}

              {complaint.studentName ? (
                <Text style={styles.detail}>Student: {complaint.studentName}</Text>
              ) : null}

              {(complaint.rollNumber || complaint.roll) ? (
                <Text style={styles.detail}>
                  Roll No: {complaint.rollNumber || complaint.roll}
                </Text>
              ) : null}

              {complaint.assignedWorker ? (
                <Text style={styles.assignedText}>
                  Assigned Worker: {complaint.assignedWorker}
                </Text>
              ) : null}

              {shownWorkerId ? (
                <Text style={styles.detail}>Worker ID: {shownWorkerId}</Text>
              ) : null}

              {complaint.highlightedByWarden ? (
                <View style={styles.highlightBadge}>
                  <Text style={styles.highlightBadgeText}>
                    Highlighted by Warden
                  </Text>
                </View>
              ) : null}

              <Text style={styles.viewMore}>Tap to view full details</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

function normalizePor(por) {
  const raw = (por || "").trim().toLowerCase().replace(/[_-]+/g, " ");

  if (
    raw === "gsec maintenance" ||
    raw === "maintenance" ||
    raw === "gsec_maintenance"
  ) {
    return "GSec Maintenance";
  }

  if (raw === "gsec mess" || raw === "mess" || raw === "gsec_mess") {
    return "GSec Mess";
  }

  if (raw === "gsec sports" || raw === "sports" || raw === "gsec_sports") {
    return "GSec Sports";
  }

  return por || "";
}

function normalizeCategory(category) {
  return (category || "").trim().toLowerCase();
}

function getAllowedCategoriesByPor(por) {
  const normalizedPor = normalizePor(por);

  if (normalizedPor === "GSec Maintenance") {
    return ["other", "civil", "electricity"];
  }
  if (normalizedPor === "GSec Mess") return ["mess"];
  if (normalizedPor === "GSec Sports") return ["sports", "gym"];

  return [];
}

function getComplaintTypeLabel(por) {
  const normalizedPor = normalizePor(por);

  if (normalizedPor === "GSec Maintenance") return "Other, Civil, Electricity";
  if (normalizedPor === "GSec Mess") return "Mess";
  if (normalizedPor === "GSec Sports") return "Sports, Gym";

  return "All";
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
    complaint.status === "in-progress" ||
    complaint.status === "in progress" ||
    complaint.workerStatus === "accepted"
  ) {
    return "open";
  }

  return "pending";
}

function priorityRank(priority) {
  if (priority === "urgent") return 1;
  if (priority === "high") return 2;
  if (priority === "medium") return 3;
  return 4;
}

function formatType(type) {
  const value = normalizeCategory(type);

  if (value === "sports") return "Sports";
  if (value === "gym") return "Gym";
  if (value === "civil") return "Civil";
  if (value === "electricity") return "Electricity";
  if (value === "mess") return "Mess";
  return capitalize(value || "other");
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
    marginBottom: 14,
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
    marginBottom: 12,
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
    color: "#F5F7FF",
    marginBottom: 14,
  },
  emptyWrap: {
    paddingVertical: 24,
  },
  loaderWrap: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#AEB8E8",
  },
  emptySubText: {
    fontSize: 13,
    color: "#7F8BC7",
    marginTop: 6,
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
    marginBottom: 8,
  },
  type: {
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
  assignedText: {
    marginBottom: 6,
    fontSize: 13,
    color: "#8FA8FF",
    fontWeight: "700",
  },
  viewMore: {
    marginTop: 8,
    fontSize: 13,
    color: "#8FA8FF",
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
});