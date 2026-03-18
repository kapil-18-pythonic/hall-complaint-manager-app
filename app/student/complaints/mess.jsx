import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors } from "../../../src/constants/colors";
import { addComplaint } from "../../../src/store/complaintsStore";
import { createMessComplaint } from "../../../src/utils/complaintHelpers";

export default function MessComplaint() {
  const { hall } = useLocalSearchParams();

  const [priority, setPriority] = useState("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing Details", "Please fill all required fields.");
      return;
    }

    const complaint = createMessComplaint({
      title: title.trim(),
      description: description.trim(),
      hall,
    });

    addComplaint(complaint);

    Alert.alert("Complaint Submitted", "Your mess complaint has been submitted.");

    setTitle("");
    setDescription("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Mess Complaint</Text>

      <TextInput
        style={styles.input}
        placeholder="Complaint Title"
        placeholderTextColor={colors.subText}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe your complaint"
        placeholderTextColor={colors.subText}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <View style={styles.priorityRow}>
        {["low", "medium", "high", "urgent"].map((item) => (
          <Pressable
            key={item}
            style={[
              styles.priorityChip,
              priority === item && styles.activePriorityChip,
            ]}
            onPress={() => setPriority(item)}
          >
            <Text
              style={[
                styles.priorityChipText,
                priority === item && styles.activePriorityChipText,
              ]}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Complaint</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
    paddingTop: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: {
    color: colors.white,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },

  priorityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  priorityChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  activePriorityChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  priorityChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  activePriorityChipText: {
    color: colors.white,
  },
});