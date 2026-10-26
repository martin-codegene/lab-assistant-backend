import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";

export function ApiTest() {
  const [testResult, setTestResult] = useState<string>("");

  const healthCheck = useApi(api.healthCheck.bind(api));
  const listUsers = useApi(api.listUsers.bind(api));

  const handleHealthCheck = async () => {
    try {
      const result = await healthCheck.execute();
      setTestResult(`Health Check: ${JSON.stringify(result.data, null, 2)}`);
    } catch (error: any) {
      Alert.alert("Health Check Failed", error.message);
    }
  };

  const handleListUsers = async () => {
    try {
      const result = await listUsers.execute({ page: 1, limit: 5 });
      setTestResult(`Users: ${JSON.stringify(result.data, null, 2)}`);
    } catch (error: any) {
      Alert.alert("List Users Failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Test Component</Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Health Check"
          onPress={handleHealthCheck}
          disabled={healthCheck.loading}
        />
        <Button
          title="List Users"
          onPress={handleListUsers}
          disabled={listUsers.loading}
        />
      </View>

      {(healthCheck.loading || listUsers.loading) && (
        <Text style={styles.loading}>Loading...</Text>
      )}

      {testResult ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text style={styles.result}>{testResult}</Text>
        </View>
      ) : null}

      {(healthCheck.error || listUsers.error) && (
        <Text style={styles.error}>
          Error: {healthCheck.error?.message || listUsers.error?.message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  loading: {
    textAlign: "center",
    color: "#666",
    marginVertical: 10,
  },
  resultContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  resultTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  result: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  error: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
});
