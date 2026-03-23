import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { complaintTypes } from "../../src/constants/complaintTypes";

export default function StudentDashboard() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const roll = Array.isArray(params.roll) ? params.roll[0] : params.roll;
  const hall = Array.isArray(params.hall) ? params.hall[0] : params.hall;

  const handleNavigate = (route) => {
    router.push({
      pathname: route,
      params: { name, roll, hall },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.hallName}>{hall || "RK HALL"}</Text>
      <Text style={styles.welcomeText}>Welcome {name || "Student"}</Text>

      <Pressable
        style={styles.primaryButton}
        onPress={() =>
          router.push({
            pathname: "/student/my-complaints",
            params: { name, roll, hall },
          })
        }
      >
        <Text style={styles.primaryButtonText}>View My Complaints</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Complaint Types</Text>

      {complaintTypes.map((item) => (
        <Pressable
          key={item.id}
          style={styles.typeCard}
          onPress={() => handleNavigate(item.route)}
        >
          <Text style={styles.typeText}>{item.title}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F2C",
  },
  contentContainer: {
    paddingHorizontal: 15,
    paddingTop: 70,
    paddingBottom: 40,
  },
  hallName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#d3d2e5",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 18,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#bec1d1",
    textAlign: "center",
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: "#141D6B",
    borderWidth: 1,
    borderColor: "#3147C9",
    paddingVertical: 13,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 34,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  sectionTitle: {
    color: "#acaeb7",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  typeCard: {
    backgroundColor: "#141D6B",
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  typeText: {
    color: "#F5F7FF",
    fontSize: 18,
    fontWeight: "600",
  },
});