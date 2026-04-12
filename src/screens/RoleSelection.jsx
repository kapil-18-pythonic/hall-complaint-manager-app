import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { router } from "expo-router";

export default function RoleSelection() {
  return (
    <View style={styles.container}>

      {/* Title */}
      <View style={styles.header}>

        {/* Logo */}
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Section Title */}
      <Text style={styles.title}>Select your role</Text>

      {/* Buttons */}
      <Pressable style={styles.button} onPress={() => router.push("/login/student")}>
        <Text style={styles.buttonText}>Student</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push("/login/warden")}>
        <Text style={styles.buttonText}>Warden</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push("/login/council")}>
        <Text style={styles.buttonText}>Hall Council Member</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push("/login/supervisor")}>
        <Text style={styles.buttonText}>Hall Superviser/Manager</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push("/login/worker")}>
        <Text style={styles.buttonText}>Worker</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
  width: 200,
  height: 250,
  },

  container: {
    flex: 1,
    backgroundColor: "#0A0F2C", // deep blue
    padding: 20,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginTop:-40,
    marginBottom: 4,
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#e6ecff68",
    textAlign: "center",
    marginBottom: 25,
    fontFamily: "Poppins",
  },

  button: {
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: "#141B4D",
    borderWidth: 1,
    borderColor: "#2A357A",

    // shadow (for iOS)
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },

    // elevation (for Android)
    elevation: 4,
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#E6ECFF",
  },
});