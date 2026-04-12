import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    Pressable,
    Alert,
    Image,
    ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

const BASE_URL = "https://hall-complaint-manager.onrender.com";

export default function ManagerComplaintDetails() {
    const { id } = useLocalSearchParams();

    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [forwarding, setForwarding] = useState(false);

    useEffect(() => {
        fetchComplaint();
    }, []);

    const fetchComplaint = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/complaints/${id}`);
            const data = await response.json();

            if (data.success) {
                setComplaint(data.complaint);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignWorker = async () => {
        Alert.prompt(
            "Assign Worker",
            "Enter Worker Name",
            async (workerName) => {
                if (!workerName) return;

                try {
                    setAssigning(true);

                    const response = await fetch(
                        `${BASE_URL}/api/complaints/${id}/supervisor-assign`,
                        {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                workerName,
                                workerId: workerName.toLowerCase(),
                                workerType: complaint.category,
                                supervisorName: "Manager",
                            }),
                        }
                    );

                    const data = await response.json();

                    if (!data.success) {
                        Alert.alert("Error", data.message);
                        return;
                    }

                    Alert.alert("Success", "Worker assigned successfully.");
                    fetchComplaint();
                } catch (error) {
                    Alert.alert("Error", "Failed to assign worker.");
                } finally {
                    setAssigning(false);
                }
            }
        );
    };

    const handleForwardToWarden = async () => {
        try {
            setForwarding(true);

            const response = await fetch(
                `${BASE_URL}/api/complaints/${id}/forward-to-warden`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        forwardedByCouncil: "Manager",
                        forwardedByPor: "manager",
                    }),
                }
            );

            const data = await response.json();

            if (!data.success) {
                Alert.alert("Error", data.message);
                return;
            }

            Alert.alert("Forwarded", "Complaint forwarded to Warden.");
            fetchComplaint();
        } catch (error) {
            Alert.alert("Error", "Failed to forward complaint.");
        } finally {
            setForwarding(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3A57E8" />
            </View>
        );
    }

    if (!complaint) {
        return (
            <View style={styles.center}>
                <Text>Complaint not found.</Text>
            </View>
        );
    }

    const isRed =
        complaint.studentHighlighted ||
        complaint.councilHighlighted ||
        (complaint.category === "other" &&
            ["bullied", "medical"].includes(complaint.issueType) &&
            complaint.priority === "urgent");

    return (
        <ScrollView style={styles.container}>
            <View style={[styles.card, isRed && styles.redCard]}>
                <Text style={styles.title}>{complaint.title}</Text>
                <Text style={styles.meta}>
                    {complaint.category.toUpperCase()} • {complaint.priority.toUpperCase()}
                </Text>

                <Text style={styles.section}>Description</Text>
                <Text style={styles.text}>{complaint.description}</Text>

                <Text style={styles.section}>Student</Text>
                <Text style={styles.text}>
                    {complaint.studentName} ({complaint.rollNumber})
                </Text>

                <Text style={styles.text}>Room: {complaint.roomNo || "-"}</Text>
                <Text style={styles.text}>Mobile: {complaint.mobileNo || "-"}</Text>

                {complaint.photo ? (
                    <Image
                        source={{ uri: complaint.photo }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <Text style={styles.meta}>No photo attached</Text>
                )}

                <Text style={styles.section}>Status</Text>
                <Text style={styles.text}>{complaint.status}</Text>

                {complaint.assignedWorker ? (
                    <Text style={styles.text}>
                        Assigned to: {complaint.assignedWorker}
                    </Text>
                ) : (
                    <Pressable
                        style={styles.button}
                        onPress={handleAssignWorker}
                        disabled={assigning}
                    >
                        <Text style={styles.buttonText}>
                            {assigning ? "Assigning..." : "Assign Worker"}
                        </Text>
                    </Pressable>
                )}

                {!complaint.forwardedToWarden && (
                    <Pressable
                        style={[styles.button, styles.forwardButton]}
                        onPress={handleForwardToWarden}
                        disabled={forwarding}
                    >
                        <Text style={styles.buttonText}>
                            {forwarding ? "Forwarding..." : "Forward to Warden"}
                        </Text>
                    </Pressable>
                )}
            </View>
        </ScrollView>
    );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F7FF",
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        backgroundColor: "#fff",
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#DCE2FF",
    },
    redCard: {
        borderColor: "#FF4D4F",
        backgroundColor: "#FFF2F2",
    },
    title: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1F2A5A",
    },
    meta: {
        marginVertical: 6,
        color: "#5E647A",
        fontWeight: "600",
    },
    section: {
        marginTop: 14,
        fontSize: 14,
        fontWeight: "700",
        color: "#3A57E8",
    },
    text: {
        marginTop: 4,
        color: "#444",
    },
    button: {
        marginTop: 16,
        backgroundColor: "#3A57E8",
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    forwardButton: {
        backgroundColor: "#1F2A5A",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "700",
    },
    image: {
        marginTop: 10,
        width: "100%",
        height: 200,
        borderRadius: 12,
    },
});