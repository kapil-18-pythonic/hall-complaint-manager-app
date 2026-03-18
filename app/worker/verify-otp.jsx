import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { colors } from "../../src/constants/colors";

export default function WorkerVerifyOtp() {
  const { workerId, email, name, hall, type } = useLocalSearchParams();
  const [otp, setOtp] = useState("");

  const handleVerifyOtp = () => {
    if (!otp.trim()) {
      Alert.alert("Missing OTP", "Please enter the OTP.");
      return;
    }

    if (otp.trim() !== "123456") {
      Alert.alert("Invalid OTP", "Please enter the correct OTP.");
      return;
    }

    router.push({
      pathname: "/worker/create-password",
      params: {
        workerId,
        email,
        name,
        hall,
        type,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        OTP sent to {email}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        placeholderTextColor={colors.subText}
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
      />

      <Pressable style={styles.button} onPress={handleVerifyOtp}>
        <Text style={styles.buttonText}>Verify OTP</Text>
      </Pressable>

      <Text style={styles.note}>Use demo OTP: 123456</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    color: colors.subText,
    marginBottom: 28,
    fontSize: 14,
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
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: {
    color: colors.white,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },
  note: {
    textAlign: "center",
    color: colors.subText,
    marginTop: 16,
    fontSize: 13,
  },
});