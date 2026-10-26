import { useAuth } from "@/contexts/AuthContext";
import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

export function UserProfile() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.notLoggedIn}>Not logged in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user.name || user.email}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <Text style={styles.role}>Role: {user.role}</Text>
      <Text style={styles.plan}>Plan: {user.plan}</Text>
      {user.avatarUrl && (
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notLoggedIn: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  role: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  plan: {
    fontSize: 14,
    color: "#666",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginTop: 10,
  },
});
