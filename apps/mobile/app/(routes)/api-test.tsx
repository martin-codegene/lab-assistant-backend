import { ApiTest } from "@/components/ApiTest";
import { UserProfile } from "@/components/UserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ApiTestScreen() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>API Implementation Test</Text>
        <Text style={styles.subtitle}>
          This screen tests the API implementation with secure token storage
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication Status</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              Authenticated: {isAuthenticated ? "Yes" : "No"}
            </Text>
            <Text style={styles.statusText}>
              User: {user ? user.email : "Not logged in"}
            </Text>
            <Text style={styles.statusText}>
              Role: {user ? user.role : "N/A"}
            </Text>
            <Text style={styles.statusText}>
              Plan: {user ? user.plan : "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Profile Component</Text>
          <UserProfile />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Test Component</Text>
          <ApiTest />
        </View>

        <View style={styles.buttonContainer}>
          {isAuthenticated ? (
            <Button
              title="Logout"
              onPress={async () => {
                try {
                  await logout();
                  Alert.alert(
                    "Logged out",
                    "You have been logged out successfully",
                  );
                  router.replace("/(routes)/login");
                } catch (error) {
                  Alert.alert("Error", "Failed to logout");
                }
              }}
              color="#ff3b30"
            />
          ) : (
            <Button
              title="Go to Login"
              onPress={() => router.push("/(routes)/login")}
            />
          )}

          <View style={styles.spacer} />

          <Button
            title="Back to Home"
            onPress={() => router.replace("/(tabs)")}
          />
        </View>

        <Text style={styles.note}>
          Note: The API uses expo-secure-store for token storage. Make sure the
          backend is running on http://localhost:3000
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  statusCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
    color: "#333",
  },
  buttonContainer: {
    marginTop: 20,
  },
  spacer: {
    height: 12,
  },
  note: {
    fontSize: 12,
    color: "#888",
    marginTop: 24,
    textAlign: "center",
    fontStyle: "italic",
  },
});
