import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { commonStyles } from "../../src/constants/authStyles";

const BASE_URL = "https://hall-complaint-manager.onrender.com";

export default function StudentOtp() {
  const params = useLocalSearchParams();

  const identifier = Array.isArray(params.identifier)
    ? params.identifier[0]
    : params.identifier;

  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert("Missing OTP", "Please enter the OTP.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "student",
          identifier,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        Alert.alert("Error", data.message || "Failed to verify OTP.");
        return;
      }

      router.replace({
        pathname: "/student/dashboard",
        params: {
          name: data.user.name,
          roll: data.user.roll,
          hall: data.user.hall,
          email: data.user.email,
        },
      });
    } catch (error) {
      Alert.alert("Server Error", "Could not connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResending(true);

      const response = await fetch(`${BASE_URL}/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "student",
          identifier,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        Alert.alert("Error", data.message || "Failed to resend OTP.");
        return;
      }

      Alert.alert("OTP Resent", `A new OTP was sent to ${data.user.email}`);
    } catch (error) {
      Alert.alert("Server Error", "Could not connect to backend server.");
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Verify Student OTP</Text>
        <Text style={styles.subheading}>
          Enter the OTP sent to {email || "your email"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          placeholderTextColor="#8C96C8"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />

        <Pressable
          style={styles.button}
          onPress={handleVerifyOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </Pressable>

        <Pressable onPress={handleResendOtp} disabled={resending}>
          <Text style={styles.resendText}>
            {resending ? "Resending OTP..." : "Resend OTP"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  resendText: {
    color: "#8FA8FF",
    textAlign: "center",
    marginTop: 16,
    fontSize: 15,
    fontWeight: "700",
  },
});