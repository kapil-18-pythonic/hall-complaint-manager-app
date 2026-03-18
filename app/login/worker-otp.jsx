import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, Alert, ActivityIndicator
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { commonStyles } from "../../src/constants/authStyles";

const BASE_URL = "http://10.145.204.10:5000";
export default function WorkerOtp() {
  const { identifier, email } = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert("Missing OTP", "Please enter OTP.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "worker",
          identifier,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        Alert.alert("Verification Failed", data.message || "Invalid OTP");
        return;
      }

      router.replace({
        pathname: "/worker/dashboard",
        params: {
          name: data.user.name,
          hall: data.user.hall,
          email: data.user.email,
          type: data.user.type,
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
        <Text style={commonStyles.heading}>Verify OTP</Text>
        <Text style={commonStyles.subheading}>Enter the OTP sent to your email</Text>
        <Text style={commonStyles.email}>{email}</Text>

        <TextInput
          style={commonStyles.input}
          placeholder="Enter OTP"
          placeholderTextColor="#8C96C8"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />

        <Pressable style={commonStyles.button} onPress={handleVerifyOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={commonStyles.buttonText}>Verify & Login</Text>}
        </Pressable>
      </View>
    </View>
  );
}