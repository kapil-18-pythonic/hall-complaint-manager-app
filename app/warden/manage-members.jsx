import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";

const BASE_URL = "https://hall-complaint-manager.onrender.com";

const ROLE_OPTIONS = [
  { key: "student", label: "Students" },
  { key: "worker", label: "Workers" },
  { key: "council", label: "Council" },
];

const WORKER_TYPES = ["civil", "electricity", "sports", "mess"];
const COUNCIL_PORS = ["gsec_maintenance", "gsec_mess", "gsec_sports"];

export default function ManageMembers() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const hall = Array.isArray(params.hall) ? params.hall[0] : params.hall;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;

  const [selectedRole, setSelectedRole] = useState("student");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    roll: "",
    email: "",
    type: "civil",
    por: "gsec_maintenance",
  });

  const titleMap = useMemo(
    () => ({
      student: "Student Management",
      worker: "Worker Management",
      council: "Council Management",
    }),
    []
  );

  const resetForm = () => {
    setForm({
      name: "",
      roll: "",
      email: "",
      type: "civil",
      por: "gsec_maintenance",
    });
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${BASE_URL}/api/members?role=${selectedRole}&hall=${encodeURIComponent(
          hall
        )}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch members");
      }

      setMembers(data.data || []);
    } catch (error) {
      setMembers([]);
      Alert.alert("Error", error.message || "Could not load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hall) {
      fetchMembers();
    }
  }, [selectedRole, hall]);

  const validateForm = () => {
    if (!form.name.trim()) {
      Alert.alert("Validation", "Please enter name");
      return false;
    }

    if (selectedRole === "student") {
      if (!form.roll.trim() || !form.email.trim()) {
        Alert.alert("Validation", "Student needs roll number and email");
        return false;
      }
    }

    if (selectedRole === "worker") {
      if (!form.email.trim() || !form.type.trim()) {
        Alert.alert("Validation", "Worker needs email and type");
        return false;
      }
    }

    if (selectedRole === "council") {
      if (!form.roll.trim() || !form.email.trim() || !form.por.trim()) {
        Alert.alert("Validation", "Council member needs roll, email and POR");
        return false;
      }
    }

    return true;
  };

  const handleAddMember = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const payload = {
        role: selectedRole,
        hall,
        name: form.name.trim(),
        roll: form.roll.trim(),
        email: form.email.trim(),
        type: form.type.trim().toLowerCase(),
        por: form.por.trim().toLowerCase(),
      };

      const response = await fetch(`${BASE_URL}/api/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add member");
      }

      Alert.alert("Success", data.message || "Member added successfully");
      resetForm();
      fetchMembers();
    } catch (error) {
      Alert.alert("Error", error.message || "Could not add member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = (member) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${member.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => confirmDelete(member._id),
        },
      ]
    );
  };

  const confirmDelete = async (id) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/members/${selectedRole}/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to remove member");
      }

      Alert.alert("Success", data.message || "Member removed successfully");
      fetchMembers();
    } catch (error) {
      Alert.alert("Error", error.message || "Could not remove member");
    }
  };

  const handleBulkUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file) {
        Alert.alert("Error", "No file selected");
        return;
      }

      const fileName = file.name?.toLowerCase() || "";
      const isAllowed =
        fileName.endsWith(".csv") ||
        fileName.endsWith(".xls") ||
        fileName.endsWith(".xlsx");

      if (!isAllowed) {
        Alert.alert("Invalid File", "Please upload a CSV, XLS, or XLSX file.");
        return;
      }

      setUploading(true);

      const formData = new FormData();
      formData.append("role", selectedRole);
      formData.append("hall", hall);
      formData.append("file", {
        uri: file.uri,
        name: file.name || "members.xlsx",
        type: file.mimeType || "application/octet-stream",
      });

      const response = await fetch(`${BASE_URL}/api/members/bulk-upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Bulk upload failed");
      }

      Alert.alert(
        "Upload Complete",
        `Inserted: ${data.insertedCount}\nSkipped: ${data.skippedCount}`
      );

      fetchMembers();
    } catch (error) {
      Alert.alert("Error", error.message || "Could not upload file");
    } finally {
      setUploading(false);
    }
  };

  const helperText =
    selectedRole === "student"
      ? "Excel/CSV columns: name, roll, email"
      : selectedRole === "worker"
      ? "Excel/CSV columns: name, email, type"
      : "Excel/CSV columns: name, roll, email, por";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.heading}>Manage Hall Members</Text>
            <Text style={styles.subHeading}>{hall || "Hall Not Assigned"}</Text>
          </View>

          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>

        <Text style={styles.headerNote}>
          Warden: {name || "Warden"} can manage members for this hall.
        </Text>
      </View>

      <View style={styles.tabsRow}>
        {ROLE_OPTIONS.map((role) => (
          <Pressable
            key={role.key}
            style={[
              styles.tabButton,
              selectedRole === role.key && styles.activeTabButton,
            ]}
            onPress={() => setSelectedRole(role.key)}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedRole === role.key && styles.activeTabButtonText,
              ]}
            >
              {role.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{titleMap[selectedRole]}</Text>
        <Text style={styles.sectionSubtext}>
          Add a single member manually below.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#94A3B8"
          value={form.name}
          onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
        />

        {(selectedRole === "student" || selectedRole === "council") && (
          <TextInput
            style={styles.input}
            placeholder="Roll Number"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            value={form.roll}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, roll: text }))
            }
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
        />

        {selectedRole === "worker" && (
          <View style={styles.optionWrap}>
            <Text style={styles.optionLabel}>Worker Type</Text>
            <View style={styles.optionRow}>
              {WORKER_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.optionChip,
                    form.type === type && styles.activeOptionChip,
                  ]}
                  onPress={() => setForm((prev) => ({ ...prev, type }))}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      form.type === type && styles.activeOptionChipText,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {selectedRole === "council" && (
          <View style={styles.optionWrap}>
            <Text style={styles.optionLabel}>Council POR</Text>
            <View style={styles.optionRow}>
              {COUNCIL_PORS.map((por) => (
                <Pressable
                  key={por}
                  style={[
                    styles.optionChip,
                    form.por === por && styles.activeOptionChip,
                  ]}
                  onPress={() => setForm((prev) => ({ ...prev, por }))}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      form.por === por && styles.activeOptionChipText,
                    ]}
                  >
                    {por}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <Pressable
          style={[styles.primaryButton, submitting && styles.disabledButton]}
          onPress={handleAddMember}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Add Member</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Bulk Upload</Text>
        <Text style={styles.sectionSubtext}>{helperText}</Text>

        <Pressable
          style={[styles.uploadButton, uploading && styles.disabledButton]}
          onPress={handleBulkUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload CSV / Excel File</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitle}>Existing Members</Text>
        <Pressable style={styles.smallRefreshButton} onPress={fetchMembers}>
          <Text style={styles.smallRefreshText}>Refresh</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Loading members...</Text>
        </View>
      ) : members.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No members found</Text>
          <Text style={styles.emptySubtext}>
            Add members manually or upload a CSV/Excel file.
          </Text>
        </View>
      ) : (
        members.map((member) => (
          <View key={member._id} style={styles.memberCard}>
            <View style={styles.memberTopRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {(member.name || "M").charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.memberInfoWrap}>
                <Text style={styles.memberName}>{member.name}</Text>

                {!!member.roll && (
                  <Text style={styles.memberDetail}>Roll: {member.roll}</Text>
                )}

                {!!member.email && (
                  <Text style={styles.memberDetail}>Email: {member.email}</Text>
                )}

                {!!member.type && (
                  <Text style={styles.memberDetail}>Type: {member.type}</Text>
                )}

                {!!member.por && (
                  <Text style={styles.memberDetail}>POR: {member.por}</Text>
                )}
              </View>
            </View>

            <Pressable
              style={styles.deleteButton}
              onPress={() => handleDeleteMember(member)}
            >
              <Text style={styles.deleteButtonText}>Remove Member</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F2C",
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 48,
    paddingBottom: 36,
    marginTop: 20,
  },
  headerCard: {
    backgroundColor: "#141D6B",
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F5F7FF",
  },
  subHeading: {
    marginTop: 6,
    fontSize: 15,
    color: "#9FB0FF",
    fontWeight: "600",
  },
  headerNote: {
    marginTop: 14,
    fontSize: 14,
    color: "#C9D6FF",
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: "#0F1A55",
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  backButtonText: {
    color: "#E8EEFF",
    fontWeight: "700",
    fontSize: 13,
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    backgroundColor: "#141D6B",
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#2E46D8",
    borderColor: "#4A63FF",
  },
  tabButtonText: {
    color: "#C9D6FF",
    fontWeight: "700",
    fontSize: 14,
  },
  activeTabButtonText: {
    color: "#FFFFFF",
  },
  sectionCard: {
    backgroundColor: "#141D6B",
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F5F7FF",
    marginBottom: 8,
  },
  sectionSubtext: {
    fontSize: 14,
    color: "#AEB8E8",
    marginBottom: 14,
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#0F1A55",
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#F5F7FF",
    fontSize: 15,
    marginBottom: 12,
  },
  optionWrap: {
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DCE3FF",
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    backgroundColor: "#0F1A55",
    borderWidth: 1,
    borderColor: "#3147C9",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  activeOptionChip: {
    backgroundColor: "#2E46D8",
    borderColor: "#4A63FF",
  },
  optionChipText: {
    color: "#C9D6FF",
    fontSize: 13,
    fontWeight: "700",
  },
  activeOptionChipText: {
    color: "#FFFFFF",
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: "#3B5BFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  uploadButton: {
    backgroundColor: "#1E2D8F",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.7,
  },
  listHeaderRow: {
    marginTop: 4,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallRefreshButton: {
    backgroundColor: "#0F1A55",
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  smallRefreshText: {
    color: "#DCE3FF",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#141D6B",
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 16,
    padding: 18,
  },
  emptyText: {
    fontSize: 16,
    color: "#AEB8E8",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F5F7FF",
    marginBottom: 6,
  },
  emptySubtext: {
    color: "#AEB8E8",
    fontSize: 14,
    lineHeight: 20,
  },
  memberCard: {
    backgroundColor: "#141D6B",
    borderWidth: 1,
    borderColor: "#3147C9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  memberTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2E46D8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  memberInfoWrap: {
    flex: 1,
  },
  memberName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F5F7FF",
    marginBottom: 6,
  },
  memberDetail: {
    fontSize: 14,
    color: "#AEB8E8",
    marginBottom: 4,
    lineHeight: 20,
  },
  deleteButton: {
    marginTop: 14,
    backgroundColor: "#A61D33",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});