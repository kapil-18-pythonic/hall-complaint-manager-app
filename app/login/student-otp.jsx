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
import { router, useLocalSearchParams } from "expo-router";
import { commonStyles } from "../../src/constants/authStyles";

const BASE_URL = "http://10.145.204.10:5000";

export default function StudentOtp() {
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
        Alert.alert("Verification Failed", data.message || "Invalid OTP");
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

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Verify OTP</Text>
        <Text style={styles.subheading}>Enter the OTP sent to your email</Text>
        <Text style={styles.email}>{email}</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          placeholderTextColor="#8C96C8"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />

        <Pressable style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Login</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = commonStyles;