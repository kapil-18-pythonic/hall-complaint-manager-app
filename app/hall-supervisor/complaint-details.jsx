import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  getAllComplaints,
  getWorkers,
  supervisorAssignWorker,
  supervisorRaiseQuery,
} from "../../src/services/api";

export default function HallSupervisorComplaintDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const hallParam = Array.isArray(params.hall) ? params.hall[0] : params.hall;
  const supervisorName = Array.isArray(params.name) ? params.name[0] : params.name;

  const [complaint, setComplaint] = useState(null);
  const [matchingWorkers, setMatchingWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [raisingQuery, setRaisingQuery] = useState(false);
  const [queryText, setQueryText] = useState("");

  useEffect(() => {
    loadComplaintDetails();
  }, [id]);

  const loadComplaintDetails = async () => {
    try {
      setLoading(true);

      const response = await getAllComplaints();
      const allComplaints = response?.complaints || [];
      const foundComplaint = allComplaints.find((item) => item._id === id);

      if (!foundComplaint) {
        setComplaint(null);
        setMatchingWorkers([]);
        return;
      }

      const normalizedComplaint = {
        ...foundComplaint,
        category: normalizeCategory(foundComplaint.category),
      };

      setComplaint(normalizedComplaint);

      const canAssign =
        (normalizedComplaint.category === "civil" ||
          normalizedComplaint.category === "electricity" ||
          normalizedComplaint.category === "sports" ||
          normalizedComplaint.category === "gym") &&
        !normalizedComplaint.assignedWorker &&
        getOverallComplaintState(normalizedComplaint) !== "completed" &&
        getOverallComplaintState(normalizedComplaint) !== "escalated";

      if (canAssign) {
        const workerResponse = await getWorkers(
          normalizedComplaint.hall || hallParam,
          normalizedComplaint.category
        );

        if (workerResponse.success) {
          setMatchingWorkers(workerResponse.workers || []);
        } else {
          setMatchingWorkers([]);
        }
      } else {
        setMatchingWorkers([]);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load complaint details.");
      setComplaint(null);
      setMatchingWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  const overallState = useMemo(() => {
    if (!complaint) return "pending";
    return getOverallComplaintState(complaint);
  }, [complaint]);

  const handleAssignWorker = () => {
    if (!complaint) return;

    if (overallState === "completed") {
      Alert.alert("Already Completed", "This complaint is already completed.");
      return;
    }

    if (overallState === "escalated") {
      Alert.alert(
        "Escalated Complaint",
        "This complaint has been escalated and cannot be assigned from here."
      );
      return;
    }

    if (
      !["civil", "electricity", "sports", "gym"].includes(complaint.category)
    ) {
      Alert.alert(
        "Not Allowed",
        "Worker assignment is available only for civil, electricity, sports and gym complaints."
      );
      return;
    }

    if (complaint.assignedWorker) {
      Alert.alert(
        "Already Assigned",
        `This complaint is already assigned to ${complaint.assignedWorker}.`
      );
      return;
    }

    if (matchingWorkers.length === 0) {
      Alert.alert(
        "No Workers Found",
        `No ${formatType(complaint.category)} workers found for ${complaint.hall || hallParam
        }.`
      );
      return;
    }

    Alert.alert("Assign Worker", "Choose a worker for this complaint", [
      ...matchingWorkers.map((worker) => ({
        text: `${worker.name} (${worker.workerId})`,
        onPress: async () => {
          try {
            setAssigning(true);

            const result = await supervisorAssignWorker(complaint._id, {
              workerName: worker.name,
              workerId: worker.workerId,
              workerType: worker.type,
              supervisorName: supervisorName || "Hall Supervisor",
            });

            if (!result.success) {
              Alert.alert("Error", result.message || "Could not assign worker.");
              return;
            }

            Alert.alert(
              "Assigned Successfully",
              `${worker.name} has been assigned to this complaint.`
            );

            await loadComplaintDetails();
          } catch (error) {
            Alert.alert("Error", error.message || "Could not assign worker.");
          } finally {
            setAssigning(false);
          }
        },
      })),
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleRaiseQuery = async () => {
    if (!complaint) return;

    if (!queryText.trim()) {
      Alert.alert("Missing Query", "Please enter your query first.");
      return;
    }

    try {
      setRaisingQuery(true);

      const result = await supervisorRaiseQuery(complaint._id, {
        queryText: queryText.trim(),
        raisedBy: supervisorName || "Hall Supervisor",
      });

      if (!result.success) {
        Alert.alert("Error", result.message || "Could not raise query.");
        return;
      }

      Alert.alert("Query Raised", "Your query has been sent to the student.");
      setQueryText("");
      await loadComplaintDetails();
    } catch (error) {
      Alert.alert("Error", error.message || "Could not raise query.");
    } finally {
      setRaisingQuery(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.notFoundContainer}>
        <ActivityIndicator size="large" color="#8FA8FF" />
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
            <Text style={styles.statusText}>{capitalize(overallState)}</Text>
          </View>
        </View>

        <Text style={styles.title}>{complaint.title}</Text>
        <Text style={styles.description}>{complaint.description}</Text>

        {complaint.highlightedByCouncil && (
          <View style={styles.highlightBox}>
            <Text style={styles.highlightBoxText}>
              This complaint has been highlighted by the council.
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

      {(complaint.latestQuery ||
        complaint.queryText ||
        complaint.studentQueryReply ||
        complaint.queryReply) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Query Thread</Text>

            <Text style={styles.queryLabel}>Raised Query</Text>
            <Text style={styles.queryText}>
              {complaint.latestQuery ||
                complaint.queryText ||
                "No query available"}
            </Text>

            <Text style={styles.queryLabel}>Student Reply</Text>
            <Text style={styles.queryText}>
              {complaint.studentQueryReply ||
                complaint.queryReply ||
                "No reply yet"}
            </Text>
          </View>
        )}

      {complaint.photo ? (
        <Image
          source={{ uri: complaint.photo }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.meta}>No photo attached</Text>
      )}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Supervisor Action</Text>

        {["civil", "electricity", "sports", "gym"].includes(
          complaint.category
        ) ? (
          overallState === "completed" ? (
            <View style={styles.disabledBox}>
              <Text style={styles.disabledText}>
                This complaint is already completed.
              </Text>
            </View>
          ) : overallState === "escalated" ? (
            <View style={styles.disabledBox}>
              <Text style={styles.disabledText}>
                This complaint has been escalated and cannot be assigned from here.
              </Text>
            </View>
          ) : complaint.assignedWorker ? (
            <View style={styles.disabledBox}>
              <Text style={styles.disabledText}>
                This complaint is already assigned to {complaint.assignedWorker}.
              </Text>
            </View>
          ) : matchingWorkers.length === 0 ? (
            <View style={styles.disabledBox}>
              <Text style={styles.disabledText}>
                No matching workers available for this complaint.
              </Text>
            </View>
          ) : (
            <Pressable
              style={[styles.assignButton, assigning && styles.assignButtonDisabled]}
              onPress={handleAssignWorker}
              disabled={assigning}
            >
              <Text style={styles.assignButtonText}>
                {assigning ? "Assigning..." : "Assign Worker"}
              </Text>
            </Pressable>
          )
        ) : (
          <View style={styles.disabledBox}>
            <Text style={styles.disabledText}>
              Worker assignment is not required for this complaint type.
            </Text>
          </View>
        )}

        <View style={styles.querySection}>
          <Text style={styles.queryHeading}>Raise Query to Student</Text>

          <TextInput
            style={styles.queryInput}
            placeholder="Write your query for the student..."
            placeholderTextColor="#9AA7E6"
            multiline
            value={queryText}
            onChangeText={setQueryText}
          />

          <Pressable
            style={[
              styles.queryButton,
              raisingQuery && styles.assignButtonDisabled,
            ]}
            onPress={handleRaiseQuery}
            disabled={raisingQuery}
          >
            <Text style={styles.assignButtonText}>
              {raisingQuery ? "Sending..." : "Raise Query"}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function normalizeCategory(category) {
  return (category || "").trim().toLowerCase();
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
  return capitalize(normalized || "other");
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateTime(value) {
  if (!value) return "Not Available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not Available";

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
    marginTop: 12,
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
    marginBottom:8,
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
  assignButton: {
    backgroundColor: "#1E2D8F",
    borderWidth: 1,
    borderColor: "#4A63FF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  assignButtonDisabled: {
    opacity: 0.7,
  },
  assignButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledBox: {
    backgroundColor: "#2B356F",
    borderWidth: 1,
    borderColor: "#4756B8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  disabledText: {
    color: "#D7DBF5",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  querySection: {
    marginTop: 16,
  },
  queryHeading: {
    color: "#F5F7FF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  queryInput: {
    minHeight: 110,
    backgroundColor: "#0E1550",
    borderWidth: 1,
    borderColor: "#4257D6",
    borderRadius: 12,
    padding: 14,
    color: "#FFFFFF",
    textAlignVertical: "top",
    marginBottom: 12,
  },
  queryButton: {
    backgroundColor: "#5B3DF5",
    borderWidth: 1,
    borderColor: "#8C75FF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  queryLabel: {
    color: "#AFC2FF",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 6,
  },
  queryText: {
    color: "#E5EBFF",
    fontSize: 14,
    lineHeight: 21,
  },
});