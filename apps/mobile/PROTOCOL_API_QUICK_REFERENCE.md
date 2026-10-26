# Protocol API Quick Reference

## Import the API Client

```typescript
import { api, AssayType, AssayTypeArr } from "@/lib/api";
```

## Common Operations

### 1. Load User's Protocols

```typescript
const loadProtocols = async () => {
  try {
    const response = await api.listMyProtocols({
      page: 1,
      limit: 20,
      category: "MOLECULAR_BIOLOGY", // optional
      isPublic: true, // optional
    });

    if (response.success && response.data) {
      const protocols = response.data.data;
      const total = response.data.total;
      const totalPages = response.data.totalPages;

      // Use the protocols
      setProtocols(protocols);
    }
  } catch (error) {
    console.error("Failed to load protocols:", error);
  }
};
```

### 2. Create a New Protocol

```typescript
const createProtocol = async () => {
  try {
    const response = await api.createProtocol({
      name: "PCR Amplification Protocol",
      description: "Standard PCR protocol for DNA amplification",
      category: "PCR",
      version: "1.0.0",
      isPublic: true,
      isTemplate: false,
      materials: [
        {
          name: "Template DNA",
          quantity: "100",
          unit: "ng",
          catalogNumber: "DNA-001",
          supplier: "Thermo Fisher",
        },
        {
          name: "Taq Polymerase",
          quantity: "1",
          unit: "U",
        },
      ],
      steps: [
        {
          step: 1,
          action: "Prepare master mix on ice",
          duration: "10 min",
          notes: "Keep all reagents cold",
        },
        {
          step: 2,
          action: "Add template DNA",
          duration: "5 min",
        },
      ],
      conditions: {
        temperature: "95°C",
        pH: "7.4",
      },
      safetyNotes: "Wear appropriate PPE",
      references: "Standard molecular biology protocols",
    });

    if (response.success && response.data) {
      const newProtocol = response.data;
      console.log("Created protocol:", newProtocol.id);
    }
  } catch (error) {
    console.error("Failed to create protocol:", error);
  }
};
```

### 3. Get Protocol Details

```typescript
const getProtocolDetails = async (protocolId: string) => {
  try {
    const response = await api.getProtocol(protocolId);

    if (response.success && response.data) {
      const protocol = response.data;

      // Access protocol details
      console.log("Name:", protocol.name);
      console.log("Steps:", protocol.steps);
      console.log("Creator:", protocol.createdBy?.name);
    }
  } catch (error) {
    console.error("Failed to get protocol:", error);
  }
};
```

### 4. Update a Protocol

```typescript
const updateProtocol = async (protocolId: string) => {
  try {
    const response = await api.updateProtocol(protocolId, {
      name: "Updated Protocol Name",
      description: "Updated description",
      isPublic: false,
      // Only include fields you want to update
    });

    if (response.success && response.data) {
      console.log("Protocol updated successfully");
    }
  } catch (error) {
    console.error("Failed to update protocol:", error);
  }
};
```

### 5. Delete a Protocol

```typescript
const deleteProtocol = async (protocolId: string) => {
  try {
    const response = await api.deleteProtocol(protocolId);

    if (response.success) {
      console.log("Protocol deleted successfully");
    }
  } catch (error) {
    console.error("Failed to delete protocol:", error);
  }
};
```

### 6. Duplicate a Protocol

```typescript
const duplicateProtocol = async (protocolId: string) => {
  try {
    const response = await api.duplicateProtocol(protocolId, {
      name: "My Protocol (Copy)",
      description: "Duplicated from original",
    });

    if (response.success && response.data) {
      const duplicatedProtocol = response.data;
      console.log("Duplicated protocol:", duplicatedProtocol.id);
    }
  } catch (error) {
    console.error("Failed to duplicate protocol:", error);
  }
};
```

### 7. Search Protocols

```typescript
const searchProtocols = async (query: string) => {
  try {
    const response = await api.searchProtocols({
      query: query,
      page: 1,
      limit: 20,
      category: "PCR", // optional
    });

    if (response.success && response.data) {
      const results = response.data.data;
      console.log(`Found ${results.length} protocols`);
    }
  } catch (error) {
    console.error("Failed to search protocols:", error);
  }
};
```

### 8. Get Public Protocols

```typescript
const getPublicProtocols = async () => {
  try {
    const response = await api.getPublicProtocols({
      page: 1,
      limit: 20,
      category: "PCR", // optional
    });

    if (response.success && response.data) {
      const publicProtocols = response.data.data;
      // Display public protocols
    }
  } catch (error) {
    console.error("Failed to get public protocols:", error);
  }
};
```

### 9. Get Protocol Templates

```typescript
const getTemplates = async () => {
  try {
    const response = await api.getProtocolTemplates({
      page: 1,
      limit: 20,
    });

    if (response.success && response.data) {
      const templates = response.data.data;
      // Display templates
    }
  } catch (error) {
    console.error("Failed to get templates:", error);
  }
};
```

### 10. Track Protocol Usage

```typescript
const trackUsage = async (protocolId: string) => {
  try {
    const response = await api.incrementProtocolUsage(protocolId);

    if (response.success) {
      console.log("Usage tracked successfully");
    }
  } catch (error) {
    console.error("Failed to track usage:", error);
  }
};
```

## Protocol Categories

```typescript
export type AssayType =
  | "PCR"
  | "ELISA"
  | "WESTERN_BLOT"
  | "MICROSCOPY"
  | "FLOW_CYTOMETRY"
  | "CELL_CULTURE"
  | "PROTEIN_EXPRESSION"
  | "DNA_SEQUENCING"
  | "GEL"
  | "OTHER";

// Helper array for UI dropdowns
export const AssayTypeArr = [
  { label: "PCR", value: "PCR" },
  { label: "ELISA", value: "ELISA" },
  { label: "Western Blot", value: "WESTERN_BLOT" },
  { label: "Microscopy", value: "MICROSCOPY" },
  { label: "Flow Cytometry", value: "FLOW_CYTOMETRY" },
  { label: "Cell Culture", value: "CELL_CULTURE" },
  { label: "Protein Expression", value: "PROTEIN_EXPRESSION" },
  { label: "DNA Sequencing", value: "DNA_SEQUENCING" },
  { label: "Gel", value: "GEL" },
  { label: "Other", value: "OTHER" },
];
```

## Response Format

All API methods return a response in this format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

### Paginated Response

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

## Error Handling Pattern

```typescript
try {
  const response = await api.someMethod();

  if (response.success && response.data) {
    // Handle success
    const data = response.data;
  } else {
    // Handle API error
    Alert.alert("Error", response.error || "Operation failed");
  }
} catch (error: any) {
  // Handle network/unexpected errors
  Alert.alert("Error", error.message || "An error occurred");
}
```

## Complete Protocol Type

```typescript
interface Protocol {
  id: string;
  name: string;
  description?: string;
  category: ProtocolCategory;
  version: string;
  isPublic: boolean;
  isTemplate: boolean;
  materials: ProtocolMaterial[];
  steps: ProtocolStep[];
  conditions: ProtocolConditions;
  safetyNotes?: string;
  references?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
  createdBy?: User;
}

interface ProtocolMaterial {
  name: string;
  quantity: string;
  unit: string;
  catalogNumber?: string;
  supplier?: string;
}

interface ProtocolStep {
  step: number;
  action: string;
  duration: string;
  notes?: string;
  materials?: string[];
}

interface ProtocolConditions {
  temperature?: string;
  pH?: string;
  humidity?: string;
  pressure?: string;
  other?: Record<string, any>;
}
```

## Tips

1. **Always check `response.success`** before accessing `response.data`
2. **Use try-catch** for network errors
3. **Provide user feedback** with Alert or Toast
4. **Handle loading states** during API calls
5. **Implement pagination** for large lists
6. **Cache data locally** for offline support
7. **Debounce search** to reduce API calls
8. **Show retry options** on errors
9. **Validate data** before sending to API
10. **Log errors** for debugging

## Example: Complete CRUD Component

```typescript
import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import { api, Protocol } from "@/lib/api";

export default function ProtocolManager() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = async () => {
    setLoading(true);
    try {
      const response = await api.listMyProtocols({ page: 1, limit: 20 });
      if (response.success && response.data) {
        setProtocols(response.data.data);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await api.deleteProtocol(id);
      if (response.success) {
        setProtocols(prev => prev.filter(p => p.id !== id));
        Alert.alert("Success", "Protocol deleted");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await api.duplicateProtocol(id);
      if (response.success && response.data) {
        setProtocols(prev => [response.data!, ...prev]);
        Alert.alert("Success", "Protocol duplicated");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  if (loading) return <Text>Loading...</Text>;

  return (
    <View>
      {protocols.map(protocol => (
        <View key={protocol.id}>
          <Text>{protocol.name}</Text>
          <Button title="Delete" onPress={() => handleDelete(protocol.id)} />
          <Button title="Duplicate" onPress={() => handleDuplicate(protocol.id)} />
        </View>
      ))}
    </View>
  );
}
```
