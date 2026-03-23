import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  getAllComplaints,
  workerTakeoverComplaint,
  workerCompleteComplaint,
} from "../../src/services/api";

export default function WorkerComplaintDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const hall = Array.isArray(params.hall) ? params.hall[0] : params.hall;
  const type = Array.isArray(params.type) ? params.type[0] : params.type;
  const workerId = Array.isArray(params.workerId)
    ? params.workerId[0]
    : params.workerId;

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    loadComplaint();
  }, [id]);

  const loadComplaint = async () => {
    try {
      setLoading(true);

      const response = await getAllComplaints();
      const allComplaints = response?.complaints || [];
      const foundComplaint = allComplaints.find((item) => item._id === id);

      setComplaint(foundComplaint || null);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load complaint.");
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  const overallState = useMemo(() => {
    if (!complaint) return "pending";
    return getOverallComplaintState(complaint);
  }, [complaint]);

  if (loading) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Loading complaint details...</Text>
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Complaint not found.</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const takenBySomeoneElse =
    complaint.assignedWorker && complaint.assignedWorker !== name;
  const takenByMe =
    complaint.assignedWorker === name ||
    (workerId &&
      complaint.assignedWorkerId &&
      String(complaint.assignedWorkerId) === String(workerId));

  const handleTakeComplaint = async () => {
    try {
      setTaking(true);

      const result = await workerTakeoverComplaint(complaint._id, {
        workerName: name,
        workerId: workerId ? String(workerId) : String(name),
        workerType: type,
      });

      if (!result.success) {
        Alert.alert("Unavailable", result.message || "Could not take complaint.");
        return;
      }

      Alert.alert("Success", "You have taken this complaint.");
      await loadComplaint();
    } catch (error) {
      Alert.alert("Error", error.message || "Could not take complaint.");
    } finally {
      setTaking(false);
    }
  };

  const handleMarkCompleted = async () => {
    try {
      setCompleting(true);

      const result = await workerCompleteComplaint(complaint._id);

      if (!result.success) {
        Alert.alert("Error", result.message || "Could not update complaint.");
        return;
      }

      Alert.alert("Updated", "Complaint marked as completed.");
      await loadComplaint();
    } catch (error) {
      Alert.alert("Error", error.message || "Could not update complaint.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Pressable style={styles.backTop} onPress={() => router.back()}>
        <Text style={styles.backTopText}>← Back</Text>
      </Pressable>

      <Text style={styles.heading}>Complaint Details</Text>

      <View style={styles.profileCard}>
        <Text style={styles.info}>Worker: {name || "Worker"}</Text>
        <Text style={styles.info}>Hall: {hall || "Not Assigned"}</Text>
        <Text style={styles.info}>Type: {formatType(type) || "Not Assigned"}</Text>
      </View>

      <View style={styles.card}>
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
              {capitalize(overallState === "open" ? "pending" : overallState)}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{complaint.title}</Text>
        <Text style={styles.description}>{complaint.description}</Text>

        {complaint.highlightedByWarden && (
          <View style={styles.highlightBox}>
            <Text style={styles.highlightBoxText}>
              This complaint has been highlighted by the warden.
            </Text>
            {complaint.highlightedAt && (
              <Text style={styles.highlightTime}>
                Highlighted At: {formatDateTime(complaint.highlightedAt)}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Student Information</Text>
        <Text style={styles.detail}>
          Submitted By: {complaint.studentName || "Not Available"}
        </Text>
        <Text style={styles.detail}>
          Roll Number: {complaint.rollNumber || "Not Available"}
        </Text>
        <Text style={styles.detail}>
          Mobile Number: {complaint.mobileNo || "Not Provided"}
        </Text>
        <Text style={styles.detail}>
          Room Number: {complaint.roomNo || "Not Provided"}
        </Text>
        <Text style={styles.detail}>Hall: {complaint.hall || "Not Available"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Complaint Information</Text>
        <Text style={styles.detail}>
          Complaint ID: {complaint._id || "Not Available"}
        </Text>
        <Text style={styles.detail}>Type: {formatType(complaint.category)}</Text>
        <Text style={styles.detail}>
          Priority: {capitalize(complaint.priority || "medium")}
        </Text>
        <Text style={styles.detail}>
          Escalated: {complaint.escalated ? "Yes" : "No"}
        </Text>
        <Text style={styles.detail}>
          Submitted At: {formatDateTime(complaint.createdAt)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Worker / Resolution Status</Text>

        <Text style={styles.detail}>
          Assigned Worker: {complaint.assignedWorker || "Not Assigned"}
        </Text>

        <Text style={styles.detail}>
          Worker ID: {complaint.assignedWorkerId || "Not Assigned"}
        </Text>

        <Text style={styles.detail}>
          Assigned At: {formatDateTime(complaint.assignedAt)}
        </Text>

        <Text style={styles.detail}>
          Worker Status: {capitalize(complaint.workerStatus || "pending")}
        </Text>

        <Text style={styles.detail}>
          Student Status: {capitalize(complaint.studentStatus || "pending")}
        </Text>

        <Text style={styles.detail}>
          Worker Completed At: {formatDateTime(complaint.workerCompletedAt)}
        </Text>

        <Text style={styles.detail}>
          Final Completed At: {formatDateTime(complaint.completedAt)}
        </Text>
      </View>

      {complaint.photo && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Attached Photo</Text>
          <Image source={{ uri: complaint.photo }} style={styles.image} />
        </View>
      )}

      {!complaint.assignedWorker && (
        <Pressable
          style={[styles.takeButton, taking && styles.buttonDisabled]}
          onPress={handleTakeComplaint}
          disabled={taking}
        >
          <Text style={styles.takeButtonText}>
            {taking ? "Taking..." : "Take Over Complaint"}
          </Text>
        </Pressable>
      )}

      {takenBySomeoneElse && (
        <Pressable style={styles.disabledTakeButton} disabled>
          <Text style={styles.disabledTakeButtonText}>Already Taken</Text>
        </Pressable>
      )}

      {takenByMe &&
        complaint.workerStatus !== "completed" &&
        !complaint.escalated && (
          <Pressable
            style={[styles.completeButton, completing && styles.buttonDisabled]}
            onPress={handleMarkCompleted}
            disabled={completing}
          >
            <Text style={styles.completeButtonText}>
              {completing ? "Updating..." : "Mark Completed"}
            </Text>
          </Pressable>
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
  if (type === "sports" || type === "gym") return "Sports & Gym";
  if (type === "civil") return "Civil";
  if (type === "electricity") return "Electricity";
  if (type === "mess") return "Mess";
  return type;
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateTime(value) {
  if (!value) return "Not Available";

  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
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
  notFoundContainer: {
    flex: 1,
    backgroundColor: "#0A0F2C",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  notFoundText: {
    color: "#F5F7FF",
    fontSize: 18,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#1E2D8F",
    borderWidth: 1,
    borderColor: "#4A63FF",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  backTop: {
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  backTopText: {
    color: "#8FA8FF",
    fontSize: 16,
    fontWeight: "700",
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
    marginBottom: 14,
  },
  info: {
    fontSize: 15,
    color: "#AEB8E8",
    marginBottom: 4,
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
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F5F7FF",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: "#DCE3FF",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F5F7FF",
    marginBottom: 10,
  },
  detail: {
    fontSize: 14,
    color: "#AEB8E8",
    marginBottom: 6,
    lineHeight: 20,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    marginTop: 8,
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
    backgroundColor: "#7C3AED",
  },
  open: {
    backgroundColor: "#3B82F6",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  takeButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  takeButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledTakeButton: {
    backgroundColor: "#6B7280",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  disabledTakeButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
  completeButton: {
    backgroundColor: "#1E2D8F",
    borderWidth: 1,
    borderColor: "#4A63FF",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  completeButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
  highlightBox: {
    marginTop: 14,
    backgroundColor: "#2A1F5F",
    borderWidth: 1,
    borderColor: "#8B5CF6",
    borderRadius: 14,
    padding: 14,
  },
  highlightBoxText: {
    color: "#E9DDFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  highlightTime: {
    color: "#CFC4FF",
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});