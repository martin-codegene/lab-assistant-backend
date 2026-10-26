# Experiment Details Screen - API Integration Guide

This guide shows how to update the experiment details screen to fetch and display real data from the API instead of using mock data.

## Current State

The experiment details screen (`screens/experiement-details-screen.tsx`) currently uses mock data defined in `MOCK_RUNS`. It needs to be updated to:

1. Fetch experiment data from the API
2. Transform API data to the UI format
3. Handle loading and error states
4. Support real-time updates for running experiments

## Step-by-Step Integration

### Step 1: Add API Import and State Management

Add these imports at the top of the file:

```typescript
import {
  api,
  Experiment as ApiExperiment,
  AssayType as ApiAssayType,
} from "@/lib/api";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
```

### Step 2: Add State Variables

Replace the demo state with real data state:

```typescript
export default function ExperimentDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();

  // State for API data
  const [experiment, setExperiment] = useState<ApiExperiment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [focusMode, setFocusMode] = useState<FocusMode>("evidence");

  // Bottom sheet refs
  const aiSheetRef = useRef<BottomSheetModal>(null);
  const aiSnapPoints = useMemo(() => ["50%", "85%"], []);

  // ... rest of component
}
```

### Step 3: Create Data Transformation Function

Add a function to transform API experiment data to UI format:

```typescript
function transformExperimentToRun(experiment: ApiExperiment): ExperimentRun {
  // Map API assay type to UI type
  const typeMap: Record<ApiAssayType, AssayType> = {
    PCR: "PCR",
    GEL: "Gel",
    WESTERN_BLOT: "Western",
    ELISA: "ELISA",
    FLOW_CYTOMETRY: "Flow",
    // Add other mappings as needed
    MICROSCOPY: "PCR", // Default fallback
    CELL_CULTURE: "PCR",
    PROTEIN_EXPRESSION: "Western",
    DNA_SEQUENCING: "PCR",
    OTHER: "PCR",
  };

  // Determine status based on experiment status and success
  let status: RunStatus = "warning";
  if (experiment.status === "COMPLETED") {
    status = experiment.success ? "success" : "failed";
  } else if (experiment.status === "FAILED") {
    status = "failed";
  }

  // Format date
  const date = experiment.startDate
    ? new Date(experiment.startDate).toLocaleString()
    : new Date(experiment.createdAt).toLocaleString();

  // Extract tags from variables
  const tags = Object.keys(experiment.variables).slice(0, 5);

  // Parse results for observations and causes
  const observation =
    experiment.notes || experiment.description || "No observations recorded";
  const causes = experiment.conclusion
    ? [experiment.conclusion]
    : ["Analysis in progress"];
  const nextStep =
    experiment.status === "IN_PROGRESS"
      ? "Continue monitoring experiment progress"
      : experiment.status === "COMPLETED"
        ? "Review results and archive"
        : "Review and restart experiment";

  return {
    id: experiment.id,
    protocolName: experiment.protocol?.name || "Unknown Protocol",
    type: typeMap[experiment.protocol?.category || "OTHER"],
    date,
    operator:
      experiment.createdBy?.name || experiment.createdBy?.email || "Unknown",
    status,
    observation,
    causes,
    nextStep,
    tags,
    // Type-specific data would need to be parsed from experiment.results
    // For now, we'll use defaults or parse from variables
  };
}
```

### Step 4: Add Data Fetching Effect

Add an effect to fetch experiment data:

```typescript
useEffect(() => {
  if (params.id) {
    loadExperiment(params.id);
  }
}, [params.id]);

const loadExperiment = async (experimentId: string) => {
  try {
    setIsLoading(true);
    setError(null);

    const response = await api.getExperimentWithAnalyses(experimentId);

    if (response.success && response.data) {
      setExperiment(response.data);
    } else {
      setError(response.error || "Failed to load experiment");
    }
  } catch (err: any) {
    setError(err.message || "An error occurred");
  } finally {
    setIsLoading(false);
  }
};
```

### Step 5: Add Polling for Running Experiments

Add polling for experiments that are in progress:

```typescript
useEffect(() => {
  if (!experiment || experiment.status !== "IN_PROGRESS") return;

  const interval = setInterval(() => {
    if (params.id) {
      loadExperiment(params.id);
    }
  }, 5000); // Poll every 5 seconds

  return () => clearInterval(interval);
}, [experiment?.status, params.id]);
```

### Step 6: Update Render Logic

Replace the mock data usage with transformed data:

```typescript
// Transform experiment data to UI format
const run = experiment ? transformExperimentToRun(experiment) : null;

// Show loading state
if (isLoading) {
  return (
    <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
      <ActivityIndicator size="large" color={C.black} />
      <Text style={{ marginTop: 16, color: C.textMuted }}>
        Loading experiment...
      </Text>
    </View>
  );
}

// Show error state
if (error || !run) {
  return (
    <View style={[styles.root, { justifyContent: "center", alignItems: "center", padding: 24 }]}>
      <View style={styles.emptyIcon}>
        <HugeiconsIcon icon={AlertCircleIcon} size={28} color={C.red} />
      </View>
      <Text style={styles.emptyTitle}>Error Loading Experiment</Text>
      <Text style={styles.emptyBody}>{error || "Experiment not found"}</Text>
      <Pressable
        style={[styles.retryBtn, SHADOW_SM]}
        onPress={() => params.id && loadExperiment(params.id)}
      >
        <HugeiconsIcon icon={ReloadIcon} size={16} color={C.white} />
        <Text style={styles.retryBtnText}>Retry</Text>
      </Pressable>
    </View>
  );
}

// Continue with normal render using 'run' data
const assayCfg = ASSAY_CFG[run.type];
// ... rest of render logic
```

### Step 7: Add Action Handlers

Add handlers for experiment actions:

```typescript
const handleCompleteExperiment = async () => {
  if (!experiment) return;

  try {
    const response = await api.completeExperiment(experiment.id, {
      success: true,
      conclusion: "Experiment completed successfully",
    });

    if (response.success) {
      await loadExperiment(experiment.id);
      Alert.alert("Success", "Experiment marked as complete");
    }
  } catch (err: any) {
    Alert.alert("Error", err.message || "Failed to complete experiment");
  }
};

const handleFailExperiment = async (reason: string) => {
  if (!experiment) return;

  try {
    const response = await api.failExperiment(experiment.id, { reason });

    if (response.success) {
      await loadExperiment(experiment.id);
      Alert.alert("Experiment Failed", "Experiment marked as failed");
    }
  } catch (err: any) {
    Alert.alert("Error", err.message || "Failed to update experiment");
  }
};

const handleCancelExperiment = async (reason: string) => {
  if (!experiment) return;

  try {
    const response = await api.cancelExperiment(experiment.id, { reason });

    if (response.success) {
      await loadExperiment(experiment.id);
      Alert.alert("Experiment Cancelled", "Experiment has been cancelled");
    }
  } catch (err: any) {
    Alert.alert("Error", err.message || "Failed to cancel experiment");
  }
};
```

### Step 8: Update Action Buttons

Update the action buttons to use real handlers:

```typescript
{/* Complete button for in-progress experiments */}
{experiment?.status === "IN_PROGRESS" && (
  <Pressable
    style={[styles.actionBtnPrimary, SHADOW_DARK]}
    onPress={handleCompleteExperiment}
  >
    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} color={C.white} />
    <Text style={styles.actionBtnPrimaryText}>Mark Complete</Text>
  </Pressable>
)}

{/* Fail button */}
{experiment?.status === "IN_PROGRESS" && (
  <Pressable
    style={[styles.actionBtnDanger, SHADOW_SM]}
    onPress={() => {
      Alert.prompt(
        "Fail Experiment",
        "Enter reason for failure:",
        (reason) => handleFailExperiment(reason)
      );
    }}
  >
    <HugeiconsIcon icon={AlertCircleIcon} size={15} color={C.red} />
    <Text style={styles.actionBtnDangerText}>Mark Failed</Text>
  </Pressable>
)}
```

## Complete Example

Here's a simplified complete example:

```typescript
export default function ExperimentDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();

  // State
  const [experiment, setExperiment] = useState<ApiExperiment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<FocusMode>("evidence");

  // Refs
  const aiSheetRef = useRef<BottomSheetModal>(null);
  const aiSnapPoints = useMemo(() => ["50%", "85%"], []);

  // Load experiment
  useEffect(() => {
    if (params.id) {
      loadExperiment(params.id);
    }
  }, [params.id]);

  const loadExperiment = async (experimentId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getExperimentWithAnalyses(experimentId);

      if (response.success && response.data) {
        setExperiment(response.data);
      } else {
        setError(response.error || "Failed to load experiment");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for updates if running
  useEffect(() => {
    if (!experiment || experiment.status !== "IN_PROGRESS") return;

    const interval = setInterval(() => {
      if (params.id) loadExperiment(params.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [experiment?.status, params.id]);

  // Transform data
  const run = experiment ? transformExperimentToRun(experiment) : null;

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.root, styles.centerContent]}>
        <ActivityIndicator size="large" color={C.black} />
        <Text style={styles.loadingText}>Loading experiment...</Text>
      </View>
    );
  }

  // Error state
  if (error || !run) {
    return (
      <View style={[styles.root, styles.centerContent]}>
        <Text style={styles.errorTitle}>Error Loading Experiment</Text>
        <Text style={styles.errorBody}>{error || "Not found"}</Text>
        <Pressable onPress={() => params.id && loadExperiment(params.id)}>
          <Text>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // Normal render with run data
  return (
    <View style={styles.root}>
      {/* Your existing UI using 'run' data */}
    </View>
  );
}
```

## Testing Checklist

- [ ] Experiment loads correctly with valid ID
- [ ] Loading state displays while fetching
- [ ] Error state displays for invalid ID
- [ ] Data transforms correctly from API to UI format
- [ ] Running experiments poll for updates
- [ ] Complete action works
- [ ] Fail action works
- [ ] Cancel action works
- [ ] Back navigation works
- [ ] Retry button works on error

## Additional Enhancements

### 1. Add Pull-to-Refresh

```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  if (!params.id) return;
  setRefreshing(true);
  await loadExperiment(params.id);
  setRefreshing(false);
};

// In ScrollView
<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
```

### 2. Add Optimistic Updates

```typescript
const handleCompleteExperiment = async () => {
  if (!experiment) return;

  // Optimistic update
  setExperiment({
    ...experiment,
    status: "COMPLETED",
    success: true,
    endDate: new Date(),
  });

  try {
    await api.completeExperiment(experiment.id, {
      success: true,
      conclusion: "Completed",
    });
  } catch (err) {
    // Revert on error
    await loadExperiment(experiment.id);
    Alert.alert("Error", "Failed to complete");
  }
};
```

### 3. Add Offline Support

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = `experiment_${experimentId}`;

// Save to cache
await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(experiment));

// Load from cache
const cached = await AsyncStorage.getItem(CACHE_KEY);
if (cached) {
  setExperiment(JSON.parse(cached));
}
```

## Related Files

- `screens/experiement-details-screen.tsx` - Main screen file to update
- `lib/api.ts` - API client with experiment methods
- `EXPERIMENT_API_QUICK_REFERENCE.md` - API usage examples
- `EXPERIMENT_INTEGRATION_COMPLETE.md` - Integration overview

---

**Status**: 📝 Guide Complete - Ready for Implementation

**Last Updated**: February 23, 2026
