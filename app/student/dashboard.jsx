import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { complaintTypes } from "../../src/constants/complaintTypes";
import { colors } from "../../src/constants/colors";

export default function StudentDashboard() {
  const { name, roll, hall } = useLocalSearchParams();

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
      <Text style={styles.heading}>Student Dashboard</Text>

      <View style={styles.infoCard}>
        <Text style={styles.welcome}>Welcome, {name}</Text>
        <Text style={styles.info}>Roll Number: {roll}</Text>
        <Text style={styles.info}>Hall: {hall}</Text>
      </View>

      <Pressable
        style={styles.myComplaintsButton}
        onPress={() =>
          router.push({
            pathname: "/student/my-complaints",
            params: { name, roll, hall },
          })
        }
      >
        <Text style={styles.myComplaintsButtonText}>View My Complaints</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Complaint Type</Text>

      {complaintTypes.map((item) => (
        <Pressable
          key={item.id}
          style={styles.card}
          onPress={() => handleNavigate(item.route)}
        >
          <Text style={styles.cardText}>{item.title}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  welcome: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  info: {
    fontSize: 15,
    color: colors.subText,
    marginBottom: 4,
  },
  myComplaintsButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  myComplaintsButtonText: {
    color: colors.white,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 14,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
});