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

const BASE_URL = "http://10.145.149.215:5000";

export default function CouncilOtp() {
  const params = useLocalSearchParams();

  const identifierParam = Array.isArray(params.identifier)
    ? params.identifier[0]
    : params.identifier;

  const emailParam = Array.isArray(params.email) ? params.email[0] : params.email;

  const identifier = identifierParam || emailParam || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert("Missing OTP", "Please enter the OTP.");
      return;
    }

    if (!identifier) {
      Alert.alert("Missing Identifier", "Email/identifier is missing.");
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
          role: "council",
          identifier,
          otp: otp.trim(),
        }),
      });

      const data = await response.json();

      console.log("Council verify OTP response:", JSON.stringify(data, null, 2));

      if (!response.ok || !data.success) {
        Alert.alert("Error", data.message || "Failed to verify OTP.");
        return;
      }

      const user = data.user || {};

      const porValue = normalizePor(
        user.por || user.role || user.position || user.post || ""
      );

      const rollValue = user.roll || user.rollNo || user.rollNumber || "";
      const hallValue = user.hall || user.hostel || "";
      const emailValue = user.email || identifier || "";
      const nameValue = user.name || "Council Member";

      router.replace({
        pathname: "/council/dashboard",
        params: {
          name: nameValue,
          roll: rollValue,
          hall: hallValue,
          por: porValue,
          role: porValue,
          email: emailValue,
          identifier: emailValue,
        },
      });
    } catch (error) {
      console.log("Council verify OTP error:", error);
      Alert.alert("Server Error", "Could not connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!identifier) {
      Alert.alert("Missing Identifier", "Email/identifier is missing.");
      return;
    }

    try {
      setResending(true);

      const response = await fetch(`${BASE_URL}/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "council",
          identifier,
        }),
      });

      const data = await response.json();

      console.log("Council resend OTP response:", JSON.stringify(data, null, 2));

      if (!response.ok || !data.success) {
        Alert.alert("Error", data.message || "Failed to resend OTP.");
        return;
      }

      const sentTo =
        data?.user?.email || data?.email || emailParam || identifier || "your email";

      Alert.alert("OTP Resent", `A new OTP was sent to ${sentTo}`);
    } catch (error) {
      console.log("Council resend OTP error:", error);
      Alert.alert("Server Error", "Could not connect to backend server.");
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Verify Council OTP</Text>
        <Text style={styles.subheading}>
          Enter the OTP sent to {emailParam || identifier || "your email"}
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
          style={[styles.button, loading && styles.disabledButton]}
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

function normalizePor(por) {
  const value = (por || "").trim().toLowerCase();

  if (value === "gsec maintenance") return "GSec Maintenance";
  if (value === "gsec mess") return "GSec Mess";
  if (value === "gsec sports") return "GSec Sports";

  return por || "";
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
  disabledButton: {
    opacity: 0.7,
  },
});