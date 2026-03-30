import React, { useState } from "react";
import {
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { createComplaint } from "../../../src/services/api";

export default function OtherComplaint() {
  const params = useLocalSearchParams();

  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const roll = Array.isArray(params.roll) ? params.roll[0] : params.roll;
  const hall = Array.isArray(params.hall) ? params.hall[0] : params.hall;

  const [issueType, setIssueType] = useState("other");
  const [priority, setPriority] = useState("high");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (
      !title.trim() ||
      !description.trim() ||
      !roomNo.trim() ||
      !mobileNo.trim()
    ) {
      Alert.alert("Missing Details", "Please fill all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        category: "other",
        issueType,
        title: title.trim(),
        description: description.trim(),
        roomNo: roomNo.trim(),
        mobileNo: mobileNo.trim(),
        hall: hall || "",
        studentName: name || "",
        rollNumber: roll || "",
        priority,
      };

      const response = await createComplaint(payload);

      if (!response.success) {
        Alert.alert(
          "Submission Failed",
          response.message || "Could not submit complaint."
        );
        return;
      }

      Alert.alert(
        "Complaint Submitted",
        "Your complaint has been sent to the warden and council."
      );

      setIssueType("other");
      setPriority("high");
      setTitle("");
      setDescription("");
      setRoomNo("");
      setMobileNo("");
    } catch (error) {
      Alert.alert(
        "Submission Failed",
        error.message || "Could not submit complaint."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>🚨 Other Complaint</Text>
      <Text style={styles.subheading}>
        Report important hall-related issues for {hall || "your hall"}
      </Text>

      <Text style={styles.label}>Complaint Type</Text>
      <View style={styles.chipRow}>
        {["bullied", "medical", "other"].map((item) => (
          <Pressable
            key={item}
            style={[
              styles.chip,
              issueType === item && styles.activeChip,
            ]}
            onPress={() => setIssueType(item)}
          >
            <Text
              style={[
                styles.chipText,
                issueType === item && styles.activeChipText,
              ]}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Complaint Title"
        placeholderTextColor="#8C96C8"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe your complaint"
        placeholderTextColor="#8C96C8"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TextInput
        style={styles.input}
        placeholder="Room Number"
        placeholderTextColor="#8C96C8"
        value={roomNo}
        onChangeText={setRoomNo}
      />

      <TextInput
        style={styles.input}
        placeholder="Mobile Number"
        placeholderTextColor="#8C96C8"
        value={mobileNo}
        onChangeText={setMobileNo}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Priority</Text>
      <View style={styles.chipRow}>
        {["medium", "high", "urgent"].map((item) => (
          <Pressable
            key={item}
            style={[
              styles.chip,
              priority === item && styles.activeChip,
            ]}
            onPress={() => setPriority(item)}
          >
            <Text
              style={[
                styles.chipText,
                priority === item && styles.activeChipText,
              ]}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? "Submitting..." : "Submit Complaint"}
        </Text>
      </Pressable>
    </ScrollView>
  );
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
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: "#AEB8E8",
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    color: "#D7DBF5",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: "#141D6B",
    color: "#F5F7FF",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#141D6B",
  },
  activeChip: {
    backgroundColor: "#1E2D8F",
    borderColor: "#4A63FF",
  },
  chipText: {
    color: "#DCE3FF",
    fontSize: 13,
    fontWeight: "600",
  },
  activeChipText: {
    color: "#FFFFFF",
  },
  submitButton: {
    backgroundColor: "#1E2D8F",
    borderWidth: 1,
    borderColor: "#4A63FF",
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },
});