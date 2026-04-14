import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { createComplaint } from "../../../src/services/api";

export default function SportsGymComplaint() {
  const params = useLocalSearchParams();

  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const roll = Array.isArray(params.roll) ? params.roll[0] : params.roll;
  const hall = Array.isArray(params.hall) ? params.hall[0] : params.hall;

  const [category, setCategory] = useState("sports");
  const [priority, setPriority] = useState("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow gallery access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

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

      const formData = new FormData();

      formData.append("category", "sports & gym");
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("roomNo", roomNo.trim());
      formData.append("mobileNo", mobileNo.trim());
      formData.append("hall", hall || "");
      formData.append("studentName", name || "");
      formData.append("rollNumber", roll || "");
      formData.append("priority", priority);

      // 🔥 THIS IS THE MAIN FIX
      if (photo) {
        formData.append("photo", {
          uri: photo,
          name: "complaint.jpg",
          type: "image/jpeg",
        });
      }

      const response = await fetch(
        `${BASE_URL}/api/complaints`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        Alert.alert(
          "Submission Failed",
          data.message || "Could not submit complaint."
        );
        return;
      }

      Alert.alert(
        "Complaint Submitted",
        "Your sports & gym related complaint has been submitted."
      );

      // Reset
      setTitle("");
      setDescription("");
      setRoomNo("");
      setMobileNo("");
      setPhoto(null);
      setPriority("medium");
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
    >
      <Text style={styles.heading}>🏋️ Sports / Gym Complaint</Text>
      <Text style={styles.subheading}>
        Report sports or gym issues for {hall || "your hall"}
      </Text>

      <Text style={styles.label}>Complaint Category</Text>
      <View style={styles.categoryRow}>
        <Pressable
          style={[
            styles.categoryChip,
            category === "sports" && styles.activeCategoryChip,
          ]}
          onPress={() => setCategory("sports")}
        >
          <Text
            style={[
              styles.categoryChipText,
              category === "sports" && styles.activeCategoryChipText,
            ]}
          >
            Sports
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.categoryChip,
            category === "gym" && styles.activeCategoryChip,
          ]}
          onPress={() => setCategory("gym")}
        >
          <Text
            style={[
              styles.categoryChipText,
              category === "gym" && styles.activeCategoryChipText,
            ]}
          >
            Gym
          </Text>
        </Pressable>
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

      <Pressable style={styles.photoButton} onPress={pickImage}>
        <Text style={styles.photoButtonText}>
          {photo ? "Change Photo" : "Upload Photo (Optional)"}
        </Text>
      </Pressable>

      {photo && <Image source={{ uri: photo }} style={styles.previewImage} />}

      <Text style={styles.priorityLabel}>Priority</Text>

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
  },
  categoryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#141D6B",
  },
  activeCategoryChip: {
    backgroundColor: "#1E2D8F",
    borderColor: "#4A63FF",
  },
  categoryChipText: {
    color: "#DCE3FF",
    fontSize: 14,
    fontWeight: "600",
  },
  activeCategoryChipText: {
    color: "#FFFFFF",
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
  photoButton: {
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#141D6B",
  },
  photoButtonText: {
    color: "#E4E9FF",
    fontSize: 16,
    fontWeight: "600",
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    marginBottom: 18,
  },
  priorityLabel: {
    color: "#D7DBF5",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 2,
  },
  priorityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  priorityChip: {
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#141D6B",
  },
  activePriorityChip: {
    backgroundColor: "#1E2D8F",
    borderColor: "#4A63FF",
  },
  priorityChipText: {
    color: "#DCE3FF",
    fontSize: 13,
    fontWeight: "600",
  },
  activePriorityChipText: {
    color: "#FFFFFF",
  },
  submitButton: {
    backgroundColor: "#1E2D8F",
    borderWidth: 1,
    borderColor: "#4A63FF",
    paddingVertical: 15,
    borderRadius: 14,
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