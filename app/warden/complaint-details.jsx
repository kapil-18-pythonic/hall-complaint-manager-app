import React, { useEffect, useState } from "react";
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
import { useLocalSearchParams } from "expo-router";
import { highlightComplaint } from "../../src/services/api";

const BASE_URL = "https://hall-complaint-manager.onrender.com";

export default function ComplaintDetails() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remark, setRemark] = useState("");

  useEffect(() => {
    loadComplaint();
  }, [id]);

  /* ================= LOAD FULL DATA ================= */

  const loadComplaint = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${BASE_URL}/api/complaints/${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("Failed to load complaint.");
      }

      setComplaint(data.complaint);
    } catch (error) {
      Alert.alert("Error", error.message);
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  /* ================= WARDEN REMARK ================= */

  const handleAddRemark = async () => {
    if (!remark.trim()) {
      Alert.alert("Error", "Please enter a remark.");
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/api/complaints/${id}/warden-remark`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ remark }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        Alert.alert("Error", "Could not add remark.");
        return;
      }

      Alert.alert("Success", "Remark added.");
      setRemark("");
      loadComplaint();
    } catch {
      Alert.alert("Error", "Failed to add remark.");
    }
  };

  /* ================= ESCALATE ================= */

  const handleEscalate = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/complaints/${id}/warden-escalate`,
        { method: "PATCH" }
      );

      const data = await response.json();

      if (!data.success) {
        Alert.alert("Error", "Could not escalate.");
        return;
      }

      Alert.alert("Escalated", "Complaint escalated.");
      loadComplaint();
    } catch {
      Alert.alert("Error", "Failed to escalate.");
    }
  };

  /* ================= HIGHLIGHT ================= */

  const handleHighlight = async () => {
    const result = await highlightComplaint(id);

    if (!result?.success) {
      Alert.alert("Error", "Could not highlight.");
      return;
    }

    Alert.alert("Highlighted", "Highlighted to council.");
    loadComplaint();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F7BFF" />
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Complaint not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.heading}>Complaint Details</Text>

      <View style={styles.card}>
        <Text style={styles.title}>{complaint.title}</Text>
        <Text style={styles.meta}>Category: {complaint.category}</Text>
        <Text style={styles.meta}>Priority: {complaint.priority}</Text>
        <Text style={styles.meta}>Hall: {complaint.hall}</Text>
        <Text style={styles.meta}>Student: {complaint.studentName}</Text>
        <Text style={styles.meta}>Roll: {complaint.rollNumber}</Text>
        <Text style={styles.meta}>Room: {complaint.roomNo}</Text>
        <Text style={styles.meta}>Mobile: {complaint.mobileNo}</Text>
        <Text style={styles.meta}>Status: {complaint.status}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.desc}>{complaint.description}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Photo</Text>
        {complaint.photo ? (
          <Image
            source={{ uri: complaint.photo }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.meta}>No photo attached</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Warden Actions</Text>

        {!complaint.highlightedByWarden && (
          <Pressable style={styles.buttonPurple} onPress={handleHighlight}>
            <Text style={styles.buttonText}>Highlight to Council</Text>
          </Pressable>
        )}

        {!complaint.wardenEscalated && (
          <Pressable style={styles.buttonRed} onPress={handleEscalate}>
            <Text style={styles.buttonText}>Escalate</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add Remark</Text>

        {complaint.wardenRemark && (
          <Text style={styles.meta}>
            Existing: {complaint.wardenRemark}
          </Text>
        )}

        <TextInput
          style={styles.input}
          value={remark}
          onChangeText={setRemark}
          placeholder="Enter remark..."
          placeholderTextColor="#8FA8FF"
        />

        <Pressable style={styles.buttonBlue} onPress={handleAddRemark}>
          <Text style={styles.buttonText}>Submit Remark</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F2C", paddingTop: 18 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0A0F2C" },
  heading: { fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 16 },
  card: {
    backgroundColor: "#141D6B",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  title: { fontSize: 20, color: "#fff", fontWeight: "800" },
  meta: { color: "#C7D2FE", marginTop: 4 },
  desc: { color: "#E0E7FF", marginTop: 6 },
  sectionTitle: { color: "#fff", fontWeight: "700", marginBottom: 8 },
  image: { width: "100%", height: 220, borderRadius: 12 },
  input: {
    backgroundColor: "#1C246A",
    borderRadius: 10,
    padding: 10,
    color: "#fff",
    marginTop: 10,
  },
  buttonPurple: {
    backgroundColor: "#7C3AED",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonRed: {
    backgroundColor: "#D62828",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonBlue: {
    backgroundColor: "#3A57E8",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "700" },
});