import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { commonStyles } from "../../src/constants/authStyles";

const BASE_URL = "http://10.145.204.10:5000";

export default function StudentLogin() {
  const [roll, setRoll] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!roll.trim()) {
      Alert.alert("Missing Roll Number", "Please enter your roll number.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "student",
          identifier: roll,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        Alert.alert("Error", data.message || "Failed to send OTP.");
        return;
      }

      Alert.alert("OTP Sent", `OTP sent to ${data.user.email}`);

      router.push({
        pathname: "/login/student-otp",
        params: {
          identifier: roll,
          email: data.user.email,
        },
      });
    } catch (error) {
      Alert.alert("Server Error", "Could not connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Student Login</Text>
        <Text style={styles.subheading}>
          Enter your roll number to receive OTP
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Roll Number"
          placeholderTextColor="#8C96C8"
          value={roll}
          onChangeText={setRoll}
          autoCapitalize="characters"
        />

        <Pressable style={styles.button} onPress={handleSendOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = commonStyles;