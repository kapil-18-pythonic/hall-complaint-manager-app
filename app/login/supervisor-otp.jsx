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

export default function HallSupervisorOtp() {
  const params = useLocalSearchParams();

  const identifier = Array.isArray(params.identifier)
    ? params.identifier[0]
    : params.identifier;

  const roleParam = Array.isArray(params.role)
    ? params.role[0]
    : params.role;

  const role = roleParam || "hallSupervisor";

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role, 
          identifier,
          otp: otp.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        Alert.alert("Error", data.message || "Failed to verify OTP.");
        return;
      }

      // ✅ Destructure user details from backend response
      const { name, hall, por, email } = data.user;

      // ✅ Case-insensitive check: "manager", "Manager", or "MANAGER" will all work
      const normalizedPor = por ? por.toLowerCase() : "";

      if (normalizedPor === "manager") {
        router.replace({
          pathname: "/manager/dashboard",
          params: { name, hall, por, email },
        });
      } else {
        router.replace({
          pathname: "/hall-supervisor/dashboard",
          params: { name, hall, por, email },
        });
      }
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, identifier }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert("OTP Resent", `A new OTP was sent to ${data.user.email}`);
      } else {
        Alert.alert("Error", data.message || "Failed to resend OTP.");
      }
    } catch (error) {
      Alert.alert("Server Error", "Could not connect to backend server.");
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>
          Verify OTP
        </Text>

        <Text style={styles.subheading}>
          Enter the OTP sent to {identifier || "your email"}
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