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
import { saveWorkerPassword } from "../../src/utils/workerAuthHelpers";
import { colors } from "../../src/constants/colors";

export default function WorkerCreatePassword() {
  const { workerId, email, name, hall, type } = useLocalSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleCreatePassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Missing Details", "Please enter both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    if (password.length < 4) {
      Alert.alert("Weak Password", "Password should be at least 4 characters.");
      return;
    }

    await saveWorkerPassword(workerId, password);

    Alert.alert("Success", "Password created successfully.");

    router.replace({
      pathname: "/worker/dashboard",
      params: {
        workerId,
        name,
        email,
        hall,
        type,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Password</Text>
      <Text style={styles.subtitle}>
        Set your password for future logins
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Create Password"
        placeholderTextColor={colors.subText}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor={colors.subText}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Pressable style={styles.button} onPress={handleCreatePassword}>
        <Text style={styles.buttonText}>Save Password</Text>
      </Pressable>
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
});