import React, { useEffect, useState } from "react";
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
  highlightComplaint,
} from "../../src/services/api";

export default function ComplaintDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [highlighting, setHighlighting] = useState(false);

  useEffect(() => {
    loadComplaint();
  }, [id]);

  const loadComplaint = async () => {
    try {
      setLoading(true);

      const response = await getAllComplaints();
      const foundComplaint = (response.complaints || []).find(
        (item) => item._id === id
      );

      setComplaint(foundComplaint || null);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load complaint.");
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  const handleHighlightToCouncil = async () => {
    try {
      setHighlighting(true);

      const result = await highlightComplaint(id);

      if (!result?.success) {
        Alert.alert("Error", result?.message || "Could not highlight complaint.");
        return;
      }

      Alert.alert(
        "Complaint Highlighted",
        "This complaint has been highlighted by the warden and will now be visible to council members and workers as a priority issue."
      );

      await loadComplaint();
    } catch (error) {
      Alert.alert("Error", error.message || "Could not highlight complaint.");
    } finally {
      setHighlighting(false);
    }
  };

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

  const overallState = getOverallComplaintState(complaint);

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
            <Text style={styles.statusText}>{formatState(overallState)}</Text>
          </View>
        </View>

        <Text style={styles.title}>{complaint.title}</Text>
        <Text style={styles.description}>{complaint.description}</Text>
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
        <Text style={styles.detail}>
          Type: {formatType(complaint.category)}
        </Text>
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
          Worker Status: {complaint.workerStatus || "Not Available"}
        </Text>

        <Text style={styles.detail}>
          Student Status: {complaint.studentStatus || "Not Available"}
        </Text>

        <Text style={styles.detail}>
          Worker Completed At: {formatDateTime(complaint.workerCompletedAt)}
        </Text>

        <Text style={styles.detail}>
          Final Completed At: {formatDateTime(complaint.completedAt)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Attached Photo</Text>

        {complaint?.photo ? (
          <Image
            source={{ uri: complaint.photo }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.emptyPhotoBox}>
            <Text style={styles.emptyPhotoText}>No photo attached</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Warden Action</Text>

        <Text style={styles.detail}>
          Highlight Status: {complaint.highlightedByWarden ? "Highlighted" : "Not Highlighted"}
        </Text>

        {complaint.highlightedAt && (
          <Text style={styles.detail}>
            Highlighted At: {formatDateTime(complaint.highlightedAt)}
          </Text>
        )}

        {!complaint.highlightedByWarden ? (
          <Pressable
            style={[styles.highlightButton, highlighting && styles.buttonDisabled]}
            onPress={handleHighlightToCouncil}
            disabled={highlighting}
          >
            <Text style={styles.highlightButtonText}>
              {highlighting
                ? "Highlighting..."
                : "Highlight to Council Members"}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.highlightedBox}>
            <Text style={styles.highlightedBoxText}>
              This complaint has already been highlighted by the warden.
            </Text>
          </View>
        )}
      </View>
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
  highlightButton: {
    marginTop: 12,
    backgroundColor: "#7C3AED",
    borderWidth: 1,
    borderColor: "#A78BFA",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  highlightButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  highlightedBox: {
    marginTop: 12,
    backgroundColor: "#2A1F5F",
    borderWidth: 1,
    borderColor: "#8B5CF6",
    borderRadius: 14,
    padding: 14,
  },
  highlightedBoxText: {
    color: "#DCD6FF",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  emptyPhotoBox: {
    height: 220,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginTop: 12,
  },

  emptyPhotoText: {
    color: "#9CA3AF",
    fontSize: 15,
  }
});