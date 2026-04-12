import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    Pressable,
    StyleSheet,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";

const BASE_URL = "https://hall-complaint-manager.onrender.com";

export default function ManagerDashboard() {
    const { name, hall } = useLocalSearchParams();

    const [complaints, setComplaints] = useState([]);
    const [filteredComplaints, setFilteredComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [priorityFilter, setPriorityFilter] = useState("all");

    useEffect(() => {
        fetchComplaints();
    }, []);

    useEffect(() => {
        applyPriorityFilter();
    }, [priorityFilter, complaints]);

    const fetchComplaints = async () => {
        try {
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
        }
    };

    const applyPriorityFilter = () => {
        if (priorityFilter === "all") {
            setFilteredComplaints(complaints);
        } else {
            setFilteredComplaints(
                complaints.filter((c) => c.priority === priorityFilter)
            );
        }
    };

    const isRedHighlighted = (complaint) => {
        if (complaint.studentHighlighted) return true;
        if (complaint.councilHighlighted) return true;
        if (complaint.wardenEscalated) return true;

        if (
            complaint.category === "other" &&
            ["bullied", "medical"].includes(complaint.issueType) &&
            complaint.priority === "urgent"
        ) {
            return true;
        }

        return false;
    };

    const renderComplaint = ({ item }) => {
        const isRed = isRedHighlighted(item);

        return (
            <Pressable
                style={[
                    styles.card,
                    isRed && styles.redCard,
                ]}
                onPress={() =>
                    router.push({
                        pathname: "/manager/complaint-details",
                        params: { id: item._id },
                    })
                }
            >
                <View style={styles.rowBetween}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.priority}>
                        {item.priority.toUpperCase()}
                    </Text>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={styles.rowBetween}>
                    <Text style={styles.meta}>
                        {item.category} • Room {item.roomNo || "-"}
                    </Text>
                    <Text style={styles.meta}>
                        Status: {item.status}
                    </Text>
                </View>
            </Pressable>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3A57E8" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>
                Welcome, {name}
            </Text>
            <Text style={styles.subheading}>
                Hall: {hall}
            </Text>

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

            {/* Priority Filters */}
            <View style={styles.filterRow}>
                {["all", "low", "medium", "high", "urgent"].map((p) => (
                    <Pressable
                        key={p}
                        style={[
                            styles.filterButton,
                            priorityFilter === p && styles.activeFilter,
                        ]}
                        onPress={() => setPriorityFilter(p)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                priorityFilter === p && styles.activeFilterText,
                            ]}
                        >
                            {p.toUpperCase()}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <FlatList
                data={filteredComplaints}
                keyExtractor={(item) => item._id}
                renderItem={renderComplaint}
                contentContainerStyle={{ paddingBottom: 40 }}
            />
        </View>
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
    heading: {
        fontSize: 24,
        fontWeight: "800",
        color: "#1F2A5A",
    },
    subheading: {
        fontSize: 16,
        color: "#5E647A",
        marginBottom: 16,
    },
    filterRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 12,
    },
    filterButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: "#E3E8FF",
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    activeFilter: {
        backgroundColor: "#3A57E8",
    },
    filterText: {
        color: "#3A57E8",
        fontWeight: "600",
    },
    activeFilterText: {
        color: "#fff",
    },
    card: {
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#DCE2FF",
    },
    redCard: {
        borderColor: "#FF4D4F",
        backgroundColor: "#FFF2F2",
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1F2A5A",
    },
    description: {
        color: "#5E647A",
        marginVertical: 6,
    },
    meta: {
        fontSize: 12,
        color: "#8C96C8",
    },
    priority: {
        fontSize: 12,
        fontWeight: "700",
        color: "#3A57E8",
    },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    manageButton: {
        backgroundColor: "#1F2A5A",
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 16,
    },
});