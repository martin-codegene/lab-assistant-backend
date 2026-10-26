# Quick Start Guide - Lab Assistant AI Integration

Get up and running with the Lab Assistant AI API integration in 5 minutes.

## Prerequisites

- Node.js and npm/yarn installed
- Expo CLI installed
- Lab Assistant AI app cloned
- Backend API running

## Step 1: Install Dependencies

```bash
npm install
# or
yarn install
```

## Step 2: Configure API Base URL

Open `lib/api.ts` and update the base URL if needed:

```typescript
const API_CONFIG = {
  BASE_URL: "https://your-api-url.com/api",
  TIMEOUT: 10000,
} as const;
```

## Step 3: Start the App

```bash
npx expo start
```

## Step 4: Test Authentication

### Register a New User

```typescript
import { api } from "@/lib/api";

const response = await api.register({
  email: "test@example.com",
  password: "password123",
  name: "Test User",
});

if (response.success) {
  console.log("Registered:", response.data.user);
}
```

### Login

```typescript
const response = await api.login({
  email: "test@example.com",
  password: "password123",
});

if (response.success) {
  console.log("Logged in:", response.data.user);
}
```

## Step 5: Create a Protocol

```typescript
const protocol = await api.createProtocol({
  name: "PCR Amplification",
  description: "Standard PCR protocol",
  category: "PCR",
  version: "1.0.0",
  materials: [
    {
      name: "DNA Template",
      quantity: "50",
      unit: "ng/μL",
    },
  ],
  steps: [
    {
      step: 1,
      action: "Add DNA template to reaction mix",
      duration: "5 min",
    },
  ],
  conditions: {
    temperature: "95°C",
  },
});

console.log("Created protocol:", protocol.data.id);
```

## Step 6: Create an Experiment

```typescript
const experiment = await api.createExperiment({
  title: "PCR Test Run",
  description: "Testing new primers",
  protocolId: protocol.data.id,
  variables: {
    sampleId: "A-001",
    cycles: 35,
  },
});

console.log("Created experiment:", experiment.data.id);
```

## Step 7: Start and Complete Experiment

```typescript
// Start the experiment
await api.startExperiment(experiment.data.id);

// Update progress
await api.updateExperiment(experiment.data.id, {
  notes: "Step 1 completed successfully",
  results: [
    {
      step: 1,
      observation: "Clear solution",
      timestamp: new Date().toISOString(),
    },
  ],
});

// Complete the experiment
await api.completeExperiment(experiment.data.id, {
  success: true,
  conclusion: "PCR amplification successful",
});
```

## Common Use Cases

### 1. List User's Protocols

```typescript
const protocols = await api.listMyProtocols({
  page: 1,
  limit: 20,
});

console.log(`Found ${protocols.data.total} protocols`);
```

### 2. Search Protocols

```typescript
const results = await api.searchProtocols({
  query: "PCR",
  page: 1,
  limit: 10,
});
```

### 3. List Running Experiments

```typescript
const experiments = await api.listMyExperiments({
  status: "IN_PROGRESS",
});
```

### 4. Get Experiment with Analyses

```typescript
const experiment = await api.getExperimentWithAnalyses(experimentId);

if (experiment.success) {
  console.log("Analyses:", experiment.data.analyses);
}
```

## Navigation Examples

### Navigate to Protocol Details

```typescript
import { useRouter } from "expo-router";

const router = useRouter();

// Navigate to protocol details
router.push({
  pathname: "/(routes)/protocol-details",
  params: { id: protocolId },
});
```

### Navigate to Experiment Details

```typescript
// Navigate to experiment details
router.push({
  pathname: "/(routes)/experiment-details",
  params: { id: experimentId },
});
```

## Error Handling Pattern

```typescript
try {
  const response = await api.someMethod(params);

  if (response.success) {
    // Success - use response.data
    const data = response.data;
    console.log("Success:", data);
  } else {
    // API error - show response.error
    Alert.alert("Error", response.error || "Something went wrong");
  }
} catch (error: any) {
  // Network or unexpected error
  Alert.alert("Error", error.message || "Network error");
}
```

## React Component Pattern

```typescript
import { useEffect, useState } from "react";
import { api, Protocol } from "@/lib/api";
import { ActivityIndicator, Text, View } from "react-native";

function ProtocolList() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.listMyProtocols({ page: 1, limit: 20 });

      if (response.success && response.data) {
        setProtocols(response.data.data);
      } else {
        setError(response.error || "Failed to load protocols");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View>
      {protocols.map((protocol) => (
        <Text key={protocol.id}>{protocol.name}</Text>
      ))}
    </View>
  );
}
```

## Testing Your Integration

### 1. Test Authentication

```bash
# Register and login should work
# Token should be stored securely
# Auto-login on app restart should work
```

### 2. Test Protocol CRUD

```bash
# Create protocol
# List protocols
# Update protocol
# Delete protocol
```

### 3. Test Experiment Lifecycle

```bash
# Create experiment
# Start experiment
# Update experiment
# Complete/fail/cancel experiment
```

### 4. Test Navigation

```bash
# Navigate from protocols to experiment details
# Back navigation works
# Deep linking works
```

## Troubleshooting

### Issue: "Network request failed"

**Solution:** Check if the backend API is running and accessible

### Issue: "Unauthorized"

**Solution:** User needs to login again, token may have expired

### Issue: "Cannot read property 'data' of undefined"

**Solution:** Always check `response.success` before accessing `response.data`

### Issue: Navigation not working

**Solution:** Verify route paths match the file structure in `app/` directory

## Next Steps

1. ✅ You're now set up with basic API integration
2. 📖 Read the [Complete Integration Summary](./COMPLETE_INTEGRATION_SUMMARY.md)
3. 🔧 Implement experiment details API integration
4. 🎨 Customize UI components
5. 🚀 Add advanced features

## Useful Resources

- [Experiment API Documentation](./EXPERIMENT_API_DOCUMENTATION.md)
- [Experiment API Quick Reference](./EXPERIMENT_API_QUICK_REFERENCE.md)
- [Protocol API Quick Reference](./PROTOCOL_API_QUICK_REFERENCE.md)
- [Experiment Details Integration Guide](./EXPERIMENT_DETAILS_API_INTEGRATION_GUIDE.md)
- [Complete Integration Summary](./COMPLETE_INTEGRATION_SUMMARY.md)

## Support

If you encounter issues:

1. Check the relevant documentation
2. Verify API connectivity
3. Check authentication status
4. Review error messages
5. Check network logs

---

**Happy Coding!** 🚀

**Last Updated**: February 23, 2026
