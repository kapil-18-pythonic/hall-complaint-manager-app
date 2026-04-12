import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

const BASE_URL = "https://hall-complaint-manager.onrender.com";

export default function ManageMembers() {
  const { hall } = useLocalSearchParams();

  const [roleType, setRoleType] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roll, setRoll] = useState("");
  const [por, setPor] = useState("");

  const handleAddMember = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    if (roleType !== "student" && !email.trim()) {
      Alert.alert("Error", "Email is required");
      return;
    }

    if (roleType === "student" && !roll.trim()) {
      Alert.alert("Error", "Roll number is required");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/members/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleType,
          name,
          email,
          roll,
          hall,
          por,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        Alert.alert("Error", data.message);
        return;
      }

      Alert.alert("Success", `${roleType} added successfully`);

      setName("");
      setEmail("");
      setRoll("");
      setPor("");
    } catch (error) {
      Alert.alert("Error", "Failed to add member");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Manage Members</Text>
      <Text style={styles.subheading}>Hall: {hall}</Text>

      {/* Role Selector */}
      <View style={styles.roleRow}>
        {["student", "worker", "council", "hallSupervisor"].map((r) => (
          <Pressable
            key={r}
            style={[
              styles.roleButton,
              roleType === r && styles.activeRole,
            ]}
            onPress={() => setRoleType(r)}
          >
            <Text
              style={[
                styles.roleText,
                roleType === r && styles.activeRoleText,
              ]}
            >
              {r.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      {roleType === "student" ? (
        <TextInput
          style={styles.input}
          placeholder="Roll Number"
          value={roll}
          onChangeText={setRoll}
        />
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
      )}

      {roleType === "council" && (
        <TextInput
          style={styles.input}
          placeholder="POR (e.g. gsec welfare)"
          value={por}
          onChangeText={setPor}
        />
      )}

      {roleType === "hallSupervisor" && (
        <TextInput
          style={styles.input}
          placeholder='POR ("manager" or "hall_supervisor")'
          value={por}
          onChangeText={setPor}
        />
      )}

      <Pressable style={styles.button} onPress={handleAddMember}>
        <Text style={styles.buttonText}>Add Member</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FF",
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2A5A",
  },
  subheading: {
    marginBottom: 16,
    color: "#5E647A",
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  roleButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#E3E8FF",
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  activeRole: {
    backgroundColor: "#3A57E8",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3A57E8",
  },
  activeRoleText: {
    color: "#fff",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE2FF",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#3A57E8",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});