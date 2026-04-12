import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { commonStyles } from "../../src/constants/authStyles";

const BASE_URL = "https://hall-complaint-manager.onrender.com";

export default function HallSupervisorLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "hallSupervisor", // ✅ IMPORTANT
          identifier: email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        Alert.alert("Error", data.message || "Failed to send OTP.");
        return;
      }

      Alert.alert("OTP Sent", `OTP sent to ${data.user.email}`);

      router.push({
        pathname: "/login/supervisor-otp", // ✅ new route
        params: {
          identifier: email,
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
        <Text style={commonStyles.heading}>Hall Supervisor/Manager Login</Text>
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

        <Pressable
          style={commonStyles.button}
          onPress={handleSendOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={commonStyles.buttonText}>Send OTP</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}