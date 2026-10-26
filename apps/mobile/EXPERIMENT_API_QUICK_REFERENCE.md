# Experiment API Quick Reference

Quick reference guide for using the Experiment API in the Lab Assistant AI app.

## Import

```typescript
import { api } from "@/lib/api";
```

## Common Operations

### 1. Create Experiment

```typescript
const response = await api.createExperiment({
  title: "PCR Amplification - Sample A",
  description: "Testing new primer set for gene X",
  protocolId: "protocol-uuid-here",
  variables: {
    sampleId: "A-001",
    primerSet: "PS-123",
    templateConcentration: "50ng/μL",
    cycles: 35,
  },
  labId: "lab-uuid-here", // Optional
});

if (response.success) {
  const experiment = response.data;
  console.log("Created:", experiment.id);
}
```

### 2. Get Experiment Details

```typescript
const response = await api.getExperiment(experimentId);

if (response.success) {
  const experiment = response.data;
  console.log("Status:", experiment.status);
  console.log("Protocol:", experiment.protocol?.name);
}
```

### 3. Get Experiment with AI Analyses

```typescript
const response = await api.getExperimentWithAnalyses(experimentId);

if (response.success) {
  const experiment = response.data;
  console.log("Analyses:", experiment.analyses);
}
```

### 4. List My Experiments

```typescript
// All experiments
const response = await api.listMyExperiments({
  page: 1,
  limit: 20,
});

// Filter by status
const inProgress = await api.listMyExperiments({
  status: "IN_PROGRESS",
});

// Filter by protocol
const protocolExperiments = await api.listMyExperiments({
  protocolId: "protocol-uuid",
});
```

### 5. Start Experiment

```typescript
const response = await api.startExperiment(experimentId);

if (response.success) {
  console.log("Experiment started at:", response.data.startDate);
}
```

### 6. Update Experiment Progress

```typescript
const response = await api.updateExperiment(experimentId, {
  notes: "Step 2 completed. Observed slight color change.",
  results: [
    {
      step: 2,
      observation: "Color changed from clear to light blue",
      timestamp: new Date().toISOString(),
    },
  ],
});
```

### 7. Complete Experiment

```typescript
const response = await api.completeExperiment(experimentId, {
  success: true,
  conclusion: "PCR amplification successful. Clear bands at expected size.",
});
```

### 8. Fail Experiment

```typescript
const response = await api.failExperiment(experimentId, {
  reason: "Contamination detected in step 3. No visible bands on gel.",
});
```

### 9. Cancel Experiment

```typescript
const response = await api.cancelExperiment(experimentId, {
  reason: "Equipment malfunction. Will reschedule.",
});
```

### 10. Search Experiments

```typescript
const response = await api.searchExperiments({
  q: "PCR",
  page: 1,
  limit: 10,
});

if (response.success) {
  const experiments = response.data.data;
  console.log(`Found ${response.data.total} experiments`);
}
```

## Experiment Lifecycle

```
DRAFT → IN_PROGRESS → COMPLETED/FAILED/CANCELLED
```

### State Transitions

```typescript
// Create (DRAFT)
const exp = await api.createExperiment({...});

// Start (DRAFT → IN_PROGRESS)
await api.startExperiment(exp.data.id);

// Update during run (IN_PROGRESS)
await api.updateExperiment(exp.data.id, {
  notes: "Progress update",
  results: [...]
});

// Complete (IN_PROGRESS → COMPLETED)
await api.completeExperiment(exp.data.id, {
  success: true,
  conclusion: "Success!"
});

// OR Fail (IN_PROGRESS → FAILED)
await api.failExperiment(exp.data.id, {
  reason: "Error occurred"
});

// OR Cancel (any state → CANCELLED)
await api.cancelExperiment(exp.data.id, {
  reason: "User cancelled"
});
```

## React Component Example

```typescript
import { useEffect, useState } from "react";
import { api, Experiment } from "@/lib/api";

function ExperimentDetails({ experimentId }: { experimentId: string }) {
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExperiment();
  }, [experimentId]);

  const loadExperiment = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.getExperiment(experimentId);

      if (response.success && response.data) {
        setExperiment(response.data);
      } else {
        setError(response.error || "Failed to load experiment");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      const response = await api.completeExperiment(experimentId, {
        success: true,
        conclusion: "Experiment completed successfully",
      });

      if (response.success) {
        await loadExperiment(); // Reload to get updated data
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;
  if (!experiment) return <Text>Experiment not found</Text>;

  return (
    <View>
      <Text>{experiment.title}</Text>
      <Text>Status: {experiment.status}</Text>
      <Text>Protocol: {experiment.protocol?.name}</Text>

      {experiment.status === "IN_PROGRESS" && (
        <Button title="Complete" onPress={handleComplete} />
      )}
    </View>
  );
}
```

## Error Handling

```typescript
try {
  const response = await api.getExperiment(experimentId);

  if (response.success) {
    // Handle success
    const experiment = response.data;
  } else {
    // Handle API error
    console.error("API Error:", response.error);
  }
} catch (error: any) {
  // Handle network or unexpected errors
  console.error("Error:", error.message);
}
```

## Common Patterns

### Real-time Progress Updates

```typescript
const updateProgress = async (
  experimentId: string,
  stepNumber: number,
  observation: string,
) => {
  const experiment = await api.getExperiment(experimentId);

  if (!experiment.success) return;

  const updatedResults = [
    ...(experiment.data.results || []),
    {
      step: stepNumber,
      observation,
      timestamp: new Date().toISOString(),
    },
  ];

  await api.updateExperiment(experimentId, {
    results: updatedResults,
  });
};
```

### Polling for Updates

```typescript
useEffect(() => {
  if (experiment?.status !== "IN_PROGRESS") return;

  const interval = setInterval(async () => {
    const response = await api.getExperiment(experimentId);
    if (response.success) {
      setExperiment(response.data);
    }
  }, 5000); // Poll every 5 seconds

  return () => clearInterval(interval);
}, [experimentId, experiment?.status]);
```

### List with Pagination

```typescript
const [page, setPage] = useState(1);
const [experiments, setExperiments] = useState<Experiment[]>([]);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const response = await api.listMyExperiments({
    page,
    limit: 20,
  });

  if (response.success && response.data) {
    setExperiments([...experiments, ...response.data.data]);
    setHasMore(page < response.data.totalPages);
    setPage(page + 1);
  }
};
```

## Type Definitions

```typescript
type ExperimentStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

interface Experiment {
  id: string;
  title: string;
  description?: string;
  status: ExperimentStatus;
  protocolId: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  variables: Record<string, any>;
  results?: any[];
  conclusion?: string;
  success?: boolean;
  createdById: string;
  labId?: string;
  createdAt: Date;
  updatedAt: Date;
  protocol?: Protocol;
  createdBy?: User;
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

## Best Practices

1. **Always check response.success** before accessing data
2. **Handle errors gracefully** with try-catch blocks
3. **Store experimental variables** for reproducibility
4. **Update progress regularly** during long experiments
5. **Use proper status transitions** (don't skip states)
6. **Add meaningful conclusions** when completing experiments
7. **Include reasons** when failing or cancelling

## Related Documentation

- [Full Experiment API Documentation](./EXPERIMENT_API_DOCUMENTATION.md)
- [Protocol API Quick Reference](./PROTOCOL_API_QUICK_REFERENCE.md)
- [Integration Guide](./EXPERIMENT_INTEGRATION_COMPLETE.md)

---

**Last Updated**: February 23, 2026
