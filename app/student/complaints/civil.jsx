import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { colors } from "../../../src/constants/colors";
import { addComplaint } from "../../../src/store/complaintsStore";
import { createTrackedComplaint } from "../../../src/utils/complaintHelpers";

export default function CivilComplaint() {
  const { name, roll, hall } = useLocalSearchParams();

  const [priority, setPriority] = useState("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [photo, setPhoto] = useState(null);

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

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !roomNo.trim() || !mobileNo.trim()) {
      Alert.alert("Missing Details", "Please fill all required fields.");
      return;
    }

    const complaint = createTrackedComplaint({
      type: "civil",
      title: title.trim(),
      description: description.trim(),
      roomNo: roomNo.trim(),
      mobileNo: mobileNo.trim(),
      photo,
      hall,
      studentName: name,
      roll,
    });

    addComplaint(complaint);

    Alert.alert("Complaint Submitted", "Your civil complaint has been submitted.");

    setTitle("");
    setDescription("");
    setRoomNo("");
    setMobileNo("");
    setPhoto(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Civil Complaint</Text>

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

      <TextInput
        style={styles.input}
        placeholder="Room Number"
        placeholderTextColor={colors.subText}
        value={roomNo}
        onChangeText={setRoomNo}
      />

      <TextInput
        style={styles.input}
        placeholder="Mobile Number"
        placeholderTextColor={colors.subText}
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
      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Complaint</Text>
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
  photoButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: colors.secondary,
  },
  photoButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitButtonText: {
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