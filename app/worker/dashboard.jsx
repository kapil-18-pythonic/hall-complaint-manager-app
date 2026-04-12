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
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadComplaints = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const response = await getWorkerComplaints(hall, type, workerId);

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

  const filteredComplaints = useMemo(() => {
    const text = searchText.trim().toLowerCase();

    return complaints.filter((complaint) => {
      const overallState = getOverallComplaintState(complaint);

      const matchesSearch =
        !text ||
        complaint.title?.toLowerCase().includes(text) ||
        complaint.description?.toLowerCase().includes(text) ||
        complaint.studentName?.toLowerCase().includes(text) ||
        complaint.assignedWorker?.toLowerCase().includes(text);

      const matchesState =
        stateFilter === "all" || overallState === stateFilter;

      return matchesSearch && matchesState;
    });
  }, [complaints, searchText, stateFilter]);

  const sortedComplaints = useMemo(() => {
    return [...filteredComplaints].sort(
      (a, b) => priorityRank(a.priority) - priorityRank(b.priority)
    );
  }, [filteredComplaints]);

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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.heading}>
        {formatType(type) || "Worker"} Dashboard
      </Text>

      <View style={styles.profileCard}>
        <Text style={styles.welcome}>Welcome, {name}</Text>
        <Text style={styles.info}>Hall: {hall}</Text>
        <Text style={styles.info}>Type: {formatType(type)}</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search complaints"
        placeholderTextColor="#8C96C8"
        value={searchText}
        onChangeText={setSearchText}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {["all", "pending", "conflict", "completed"].map((item) => (
          <Pressable
            key={item}
            style={[
              styles.filterChip,
              stateFilter === item && styles.activeFilterChip,
            ]}
            onPress={() => setStateFilter(item)}
          >
            <Text style={styles.filterText}>
              {capitalize(item)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <Text style={styles.emptyText}>Loading complaints...</Text>
      ) : sortedComplaints.length === 0 ? (
        <Text style={styles.emptyText}>No assigned complaints.</Text>
      ) : (
        sortedComplaints.map((complaint) => {
          const overallState = getOverallComplaintState(complaint);

          return (
            <Pressable
              key={complaint._id}
              style={styles.card}
              onPress={() => openComplaintDetails(complaint)}
            >
              <Text style={styles.title}>{complaint.title}</Text>

              <Text style={styles.detail}>
                Submitted By: {complaint.studentName}
              </Text>

              <Text style={styles.detail}>
                Priority: {capitalize(complaint.priority)}
              </Text>

              <Text style={styles.detail}>
                Status: {capitalize(overallState)}
              </Text>

              {complaint.workerStatus !== "completed" && (
                <Pressable
                  style={styles.completeButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleMarkCompleted(complaint._id);
                  }}
                >
                  <Text style={styles.completeButtonText}>
                    Mark Completed
                  </Text>
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
  if (
    complaint.workerStatus === "completed" &&
    complaint.studentStatus === "completed"
  )
    return "completed";

  if (
    complaint.workerStatus === "completed" &&
    complaint.studentStatus === "pending"
  )
    return "conflict";

  if (complaint.workerStatus === "assigned")
    return "in-progress";

  return "pending";
}

function formatType(type) {
  if (type === "sports" || type === "gym") return "Sports & Gym";
  return type;
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function priorityRank(priority) {
  if (priority === "urgent") return 1;
  if (priority === "medium") return 2;
  if (priority === "low") return 3;
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
  searchInput: {
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: "#141D6B",
    color: "#F5F7FF",
    fontSize: 15,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#141D6B",
    marginRight: 8,
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
  emptyText: {
    fontSize: 16,
    color: "#AEB8E8",
    marginTop: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    backgroundColor: "#141D6B",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5F7FF",
    marginBottom: 6,
  },
  detail: {
    fontSize: 14,
    color: "#AEB8E8",
    marginBottom: 4,
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
});