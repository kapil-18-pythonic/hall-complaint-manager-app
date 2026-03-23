import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, Alert, ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import { commonStyles } from "../../src/constants/authStyles";

const BASE_URL = "https://hall-complaint-backend.onrender.com";
export default function WorkerLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert("Missing Email", "Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "worker",
          identifier: normalizedEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        Alert.alert("Error", data.message || "Failed to send OTP.");
        return;
      }

      Alert.alert("OTP Sent", `OTP sent to ${data.user.email}`);

      router.push({
        pathname: "/login/worker-otp",
        params: {
          identifier: normalizedEmail,
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
    <View style={commonStyles.container}>
      <View style={commonStyles.card}>
        <Text style={commonStyles.heading}>Worker Login</Text>
        <Text style={commonStyles.subheading}>
          Enter your registered email to receive OTP
        </Text>

        <TextInput
          style={commonStyles.input}
          placeholder="Enter Email"
          placeholderTextColor="#8C96C8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Pressable style={commonStyles.button} onPress={handleSendOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={commonStyles.buttonText}>Send OTP</Text>}
        </Pressable>
      </View>
    </View>
  );
}