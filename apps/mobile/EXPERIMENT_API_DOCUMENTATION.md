# Lab Assistant AI - Experiment API Documentation

## Overview

This document provides comprehensive API documentation for the Experiment endpoints. Experiments represent the actual execution of protocols in the laboratory, tracking progress, data collection, and results in real-time.

## Base URL

```
http://localhost:3000/api/experiments
```

## Authentication

All experiment endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Experiment Lifecycle

Experiments follow a state machine pattern:

```
PLANNED → IN_PROGRESS → COMPLETED/FAILED/CANCELLED
```

- **PLANNED**: Experiment is created but not started
- **IN_PROGRESS**: Experiment is actively running
- **COMPLETED**: Experiment finished successfully
- **FAILED**: Experiment encountered issues and failed
- **CANCELLED**: Experiment was cancelled before completion

## API Endpoints

### 1. Create Experiment

**POST** `/experiments`

Create a new experiment (plan a protocol run).

**Request Body:**

```typescript
{
  title: string;              // Required
  description?: string;       // Optional
  protocolId: string;         // Required - Protocol to run
  variables: Record<string, any>; // Required - Experimental variables
  labId?: string;            // Optional - Lab where experiment runs
}
```

**Example:**

```javascript
const createExperiment = async (experimentData) => {
  try {
    const response = await api.post("/experiments", experimentData);
    return response.data;
  } catch (error) {
    console.error("Failed to create experiment:", error.response?.data);
    throw error;
  }
};

// Usage
await createExperiment({
  title: "PCR Amplification - Sample A",
  description: "Testing new primer set for gene X",
  protocolId: "protocol-uuid-here",
  variables: {
    sampleId: "A-001",
    primerSet: "PS-123",
    templateConcentration: "50ng/μL",
    cycles: 35,
  },
  labId: "lab-uuid-here",
});
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "experiment-uuid",
    "title": "PCR Amplification - Sample A",
    "description": "Testing new primer set for gene X",
    "status": "PLANNED",
    "protocolId": "protocol-uuid",
    "variables": {
      "sampleId": "A-001",
      "primerSet": "PS-123",
      "templateConcentration": "50ng/μL",
      "cycles": 35
    },
    "createdById": "user-uuid",
    "labId": "lab-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Experiment created successfully"
}
```

### 2. Get Experiment by ID

**GET** `/experiments/:id`

Get detailed information about a specific experiment.

**Example:**

```javascript
const getExperiment = async (experimentId) => {
  try {
    const response = await api.get(`/experiments/${experimentId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to get experiment:", error.response?.data);
    throw error;
  }
};

// Usage
await getExperiment("experiment-uuid-here");
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "id": "experiment-uuid",
    "title": "PCR Amplification - Sample A",
    "description": "Testing new primer set for gene X",
    "status": "IN_PROGRESS",
    "protocolId": "protocol-uuid",
    "startDate": "2024-01-01T10:00:00.000Z",
    "endDate": null,
    "notes": "Started at 10:00 AM",
    "variables": {
      "sampleId": "A-001",
      "primerSet": "PS-123"
    },
    "results": [],
    "conclusion": null,
    "success": null,
    "createdById": "user-uuid",
    "labId": "lab-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z",
    "protocol": {
      "id": "protocol-uuid",
      "name": "PCR Amplification Protocol",
      "category": "PCR",
      "version": "1.0.0"
    },
    "createdBy": {
      "id": "user-uuid",
      "email": "researcher@lab.com",
      "name": "John Researcher"
    }
  }
}
```

### 3. Get Experiment with Analyses

**GET** `/experiments/:id/analyses`

Get experiment with all associated AI analyses.

**Example:**

```javascript
const getExperimentWithAnalyses = async (experimentId) => {
  try {
    const response = await api.get(`/experiments/${experimentId}/analyses`);
    return response.data;
  } catch (error) {
    console.error(
      "Failed to get experiment with analyses:",
      error.response?.data,
    );
    throw error;
  }
};

// Usage
await getExperimentWithAnalyses("experiment-uuid-here");
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "id": "experiment-uuid",
    "title": "PCR Amplification - Sample A",
    "status": "COMPLETED",
    "analyses": [
      {
        "id": "analysis-uuid",
        "type": "GEL_IMAGE",
        "modelUsed": "nova-multimodal-v1",
        "observations": [
          "Clear bands visible at expected size",
          "No primer dimers detected"
        ],
        "confidence": 0.95,
        "recommendations": [
          "Proceed with sequencing",
          "Consider reducing cycle number for future runs"
        ],
        "requestedAt": "2024-01-01T12:00:00.000Z",
        "completedAt": "2024-01-01T12:01:30.000Z"
      }
    ]
  }
}
```

### 4. Update Experiment

**PUT** `/experiments/:id`

Update experiment details, notes, results, or variables.

**Request Body:**

```typescript
{
  title?: string;
  description?: string;
  status?: ExperimentStatus;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  variables?: Record<string, any>;
  results?: any[];
  conclusion?: string;
  success?: boolean;
  labId?: string;
}
```

**Example:**

```javascript
const updateExperiment = async (experimentId, updates) => {
  try {
    const response = await api.put(`/experiments/${experimentId}`, updates);
    return response.data;
  } catch (error) {
    console.error("Failed to update experiment:", error.response?.data);
    throw error;
  }
};

// Usage - Add notes during experiment
await updateExperiment("experiment-uuid-here", {
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

**Success Response:**

```json
{
  "success": true,
  "data": {
    "id": "experiment-uuid",
    "title": "PCR Amplification - Sample A",
    "notes": "Step 2 completed. Observed slight color change.",
    "results": [
      {
        "step": 2,
        "observation": "Color changed from clear to light blue",
        "timestamp": "2024-01-01T10:30:00.000Z"
      }
    ],
    "updatedAt": "2024-01-01T10:30:00.000Z"
  },
  "message": "Experiment updated successfully"
}
```

### 5. Delete Experiment

**DELETE** `/experiments/:id`

Delete an experiment.

**Example:**

```javascript
const deleteExperiment = async (experimentId) => {
  try {
    const response = await api.delete(`/experiments/${experimentId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete experiment:", error.response?.data);
    throw error;
  }
};

// Usage
await deleteExperiment("experiment-uuid-here");
```

**Success Response:**

```json
{
  "success": true,
  "message": "Experiment deleted successfully"
}
```

### 6. List User's Experiments

**GET** `/experiments/user/my-experiments`

Get paginated list of user's experiments with optional filters.

**Query Parameters:**

- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `status` (ExperimentStatus, optional) - Filter by status
- `protocolId` (string, optional) - Filter by protocol
- `labId` (string, optional) - Filter by lab

**Example:**

```javascript
const listMyExperiments = async (params = {}) => {
  try {
    const response = await api.get("/experiments/user/my-experiments", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to list experiments:", error.response?.data);
    throw error;
  }
};

// Usage - Get in-progress experiments
await listMyExperiments({
  page: 1,
  limit: 20,
  status: "IN_PROGRESS",
});
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "experiment-uuid-1",
        "title": "PCR Amplification - Sample A",
        "status": "IN_PROGRESS",
        "startDate": "2024-01-01T10:00:00.000Z",
        "protocol": {
          "id": "protocol-uuid",
          "name": "PCR Amplification Protocol"
        }
      },
      {
        "id": "experiment-uuid-2",
        "title": "Western Blot - Protein X",
        "status": "IN_PROGRESS",
        "startDate": "2024-01-01T09:00:00.000Z",
        "protocol": {
          "id": "protocol-uuid-2",
          "name": "Western Blot Protocol"
        }
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 7. List Experiments by Protocol

**GET** `/experiments/protocol/:protocolId`

Get all experiments that used a specific protocol.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 10)

**Example:**

```javascript
const listProtocolExperiments = async (protocolId, params = {}) => {
  try {
    const response = await api.get(`/experiments/protocol/${protocolId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to list protocol experiments:", error.response?.data);
    throw error;
  }
};

// Usage
await listProtocolExperiments("protocol-uuid-here", { page: 1, limit: 10 });
```

### 8. List Experiments by Lab

**GET** `/experiments/lab/:labId`

Get all experiments in a specific lab.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 10)
- `status` (ExperimentStatus, optional)

**Example:**

```javascript
const listLabExperiments = async (labId, params = {}) => {
  try {
    const response = await api.get(`/experiments/lab/${labId}`, { params });
    return response.data;
  } catch (error) {
    console.error("Failed to list lab experiments:", error.response?.data);
    throw error;
  }
};

// Usage
await listLabExperiments("lab-uuid-here", { status: "COMPLETED" });
```

### 9. Search Experiments

**GET** `/experiments/search`

Search experiments by title, description, notes, or conclusion.

**Query Parameters:**

- `q` (string, required) - Search query
- `page` (number, default: 1)
- `limit` (number, default: 10)

**Example:**

```javascript
const searchExperiments = async (query, params = {}) => {
  try {
    const response = await api.get("/experiments/search", {
      params: { q: query, ...params },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to search experiments:", error.response?.data);
    throw error;
  }
};

// Usage
await searchExperiments("PCR", { page: 1, limit: 10 });
```

### 10. Start Experiment

**POST** `/experiments/:id/start`

Start running an experiment (transition from PLANNED to IN_PROGRESS).

**Example:**

```javascript
const startExperiment = async (experimentId) => {
  try {
    const response = await api.post(`/experiments/${experimentId}/start`);
    return response.data;
  } catch (error) {
    console.error("Failed to start experiment:", error.response?.data);
    throw error;
  }
};

// Usage
await startExperiment("experiment-uuid-here");
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "id": "experiment-uuid",
    "title": "PCR Amplification - Sample A",
    "status": "IN_PROGRESS",
    "startDate": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  },
  "message": "Experiment started successfully"
}
```

### 11. Complete Experiment

**POST** `/experiments/:id/complete`

Mark experiment as completed with success status and optional conclusion.

**Request Body:**

```typescript
{
  success: boolean;      // Required - Was experiment successful?
  conclusion?: string;   // Optional - Final conclusions
}
```

**Example:**

```javascript
const completeExperiment = async (experimentId, success, conclusion) => {
  try {
    const response = await api.post(`/experiments/${experimentId}/complete`, {
      success,
      conclusion,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to complete experiment:", error.response?.data);
    throw error;
  }
};

// Usage
await completeExperiment(
  "experiment-uuid-here",
  true,
  "PCR amplification successful. Clear bands at expected size. Ready for sequencing.",
);
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "id": "experiment-uuid",
    "title": "PCR Amplification - Sample A",
    "status": "COMPLETED",
    "startDate": "2024-01-01T10:00:00.000Z",
    "endDate": "2024-01-01T12:30:00.000Z",
    "success": true,
    "conclusion": "PCR amplification successful. Clear bands at expected size. Ready for sequencing.",
    "updatedAt": "2024-01-01T12:30:00.000Z"
  },
  "message": "Experiment completed successfully"
}
```

### 12. Fail Experiment

**POST** `/experiments/:id/fail`

Mark experiment as failed with optional reason.

**Request Body:**

```typescript
{
  reason?: string;   // Optional - Reason for failure
}
```

**Example:**

```javascript
const failExperiment = async (experimentId, reason) => {
  try {
    const response = await api.post(`/experiments/${experimentId}/fail`, {
      reason,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to mark experiment as failed:", error.response?.data);
    throw error;
  }
};

// Usage
await failExperiment(
  "experiment-uuid-here",
  "Contamination detected in step 3. No visible bands on gel.",
);
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "id": "experiment-uuid",
    "title": "PCR Amplification - Sample A",
    "status": "FAILED",
    "startDate": "2024-01-01T10:00:00.000Z",
    "endDate": "2024-01-01T11:15:00.000Z",
    "success": false,
    "conclusion": "Contamination detected in step 3. No visible bands on gel.",
    "updatedAt": "2024-01-01T11:15:00.000Z"
  },
  "message": "Experiment marked as failed"
}
```

### 13. Cancel Experiment

**POST** `/experiments/:id/cancel`

Cancel an experiment with optional reason.

**Request Body:**

```typescript
{
  reason?: string;   // Optional - Reason for cancellation
}
```

**Example:**

```javascript
const cancelExperiment = async (experimentId, reason) => {
  try {
    const response = await api.post(`/experiments/${experimentId}/cancel`, {
      reason,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to cancel experiment:", error.response?.data);
    throw error;
  }
};

// Usage
await cancelExperiment(
  "experiment-uuid-here",
  "Equipment malfunction. Will reschedule.",
);
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "id": "experiment-uuid",
    "title": "PCR Amplification - Sample A",
    "status": "CANCELLED",
    "endDate": "2024-01-01T10:45:00.000Z",
    "conclusion": "Equipment malfunction. Will reschedule.",
    "updatedAt": "2024-01-01T10:45:00.000Z"
  },
  "message": "Experiment cancelled successfully"
}
```

## Data Models

### Experiment Model

```typescript
interface Experiment {
  id: string; // UUID
  title: string; // Experiment title
  description?: string; // Experiment description
  status: ExperimentStatus; // Current status
  protocolId: string; // Protocol being run
  startDate?: Date; // When experiment started
  endDate?: Date; // When experiment ended
  notes?: string; // Lab notes during experiment
  variables: Record<string, any>; // Experimental variables
  results?: any[]; // Collected results/data
  conclusion?: string; // Final conclusions
  success?: boolean; // Was experiment successful?
  createdById: string; // User who created experiment
  labId?: string; // Lab where experiment runs
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
  protocol?: Protocol; // Protocol details (populated)
  createdBy?: User; // Creator details (populated)
}
```

### ExperimentStatus Enum

```typescript
enum ExperimentStatus {
  PLANNED = "PLANNED", // Created but not started
  IN_PROGRESS = "IN_PROGRESS", // Currently running
  COMPLETED = "COMPLETED", // Finished successfully
  FAILED = "FAILED", // Failed during execution
  CANCELLED = "CANCELLED", // Cancelled before completion
}
```

## Typical Workflow

### Running a Protocol

```javascript
// 1. Create experiment (plan the run)
const experiment = await createExperiment({
  title: "PCR - Sample A",
  protocolId: "protocol-uuid",
  variables: { sampleId: "A-001", cycles: 35 },
});

// 2. Start the experiment
await startExperiment(experiment.data.id);

// 3. Update with observations during run
await updateExperiment(experiment.data.id, {
  notes: "Step 2 completed at 10:30 AM",
  results: [{ step: 2, observation: "Color change observed" }],
});

// 4. Complete the experiment
await completeExperiment(
  experiment.data.id,
  true,
  "Successful amplification. Clear bands visible.",
);
```

## Error Handling

### Common Error Responses

**400 Bad Request:**

```json
{
  "error": "Experiment title is required"
}
```

**404 Not Found:**

```json
{
  "error": "Experiment not found"
}
```

**401 Unauthorized:**

```json
{
  "error": "Invalid or expired token"
}
```

### State Transition Errors

```json
{
  "error": "Experiment can only be started from PLANNED status"
}
```

```json
{
  "error": "Experiment can only be completed from IN_PROGRESS status"
}
```

## Best Practices

### 1. Real-time Updates

Update experiment progress regularly:

```javascript
// During experiment execution
const updateProgress = async (experimentId, stepNumber, observation) => {
  const experiment = await getExperiment(experimentId);
  const updatedResults = [
    ...(experiment.data.results || []),
    {
      step: stepNumber,
      observation,
      timestamp: new Date().toISOString(),
    },
  ];

  await updateExperiment(experimentId, {
    results: updatedResults,
  });
};
```

### 2. Track Variables

Store all experimental variables for reproducibility:

```javascript
const variables = {
  sampleId: "A-001",
  primerSet: "PS-123",
  templateConcentration: "50ng/μL",
  annealingTemp: "58°C",
  extensionTime: "30s",
  cycles: 35,
  polymerase: "Taq DNA Polymerase",
  bufferType: "10X PCR Buffer",
};
```

### 3. Handle Failures Gracefully

```javascript
try {
  await startExperiment(experimentId);
} catch (error) {
  if (error.response?.status === 400) {
    // Handle state transition error
    console.error("Cannot start experiment:", error.response.data.error);
  }
}
```

---

_Last Updated: February 23, 2026_
