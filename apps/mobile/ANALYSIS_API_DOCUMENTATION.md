# Lab Assistant AI - Analysis API Documentation

## Overview

This document provides comprehensive API documentation for the AI-powered Analysis endpoints. The Analysis system provides intelligent insights for experiments including image analysis, troubleshooting, and protocol optimization.

## Base URL

```
http://localhost:3000/api/analyses
```

## Authentication

All analysis endpoints require JWT authentication:

```
Authorization: Bearer <jwt_token>
```

## Analysis Types

The system supports six types of AI-powered analysis:

1. **GEL_IMAGE** - Gel electrophoresis image analysis
2. **WESTERN_BLOT** - Western blot image analysis
3. **CELL_MORPHOLOGY** - Cell microscopy analysis
4. **TROUBLESHOOTING** - Problem diagnosis and solutions
5. **PROTOCOL_OPTIMIZATION** - Protocol improvement suggestions
6. **DATA_INTERPRETATION** - Statistical data analysis

## API Endpoints

### 1. Analyze Gel Image (AI-Powered)

**POST** `/analyses/gel-image`

Analyze gel electrophoresis images using AI to detect bands, assess quality, and provide recommendations.

**Request Body:**

```typescript
{
  experimentId: string;        // Required
  imageUrl: string;            // Required - URL to gel image
  metadata?: {                 // Optional
    lanes?: number;
    marker?: string;
    expectedSize?: string;
  };
}
```

**Example:**

```javascript
const analyzeGelImage = async (experimentId, imageUrl, metadata) => {
  try {
    const response = await api.post("/analyses/gel-image", {
      experimentId,
      imageUrl,
      metadata,
    });
    return response.data;
  } catch (error) {
    console.error("Gel analysis failed:", error.response?.data);
    throw error;
  }
};

// Usage
await analyzeGelImage("experiment-uuid", "https://example.com/gel-image.jpg", {
  lanes: 4,
  marker: "1kb DNA ladder",
  expectedSize: "500bp",
});
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "analysis-uuid",
    "experimentId": "experiment-uuid",
    "type": "GEL_IMAGE",
    "modelUsed": "Amazon Nova",
    "observations": [
      {
        "type": "band_detection",
        "description": "Clear bands visible at expected molecular weight",
        "confidence": 0.92,
        "location": "Lane 1-3"
      },
      {
        "type": "quality_assessment",
        "description": "No primer dimers detected",
        "confidence": 0.88
      }
    ],
    "recommendations": [
      {
        "action": "Proceed with sequencing",
        "priority": "HIGH",
        "rationale": "PCR products show expected size and purity"
      }
    ],
    "nextSteps": [
      {
        "step": "Purify PCR products",
        "description": "Use column purification kit"
      }
    ],
    "confidence": 0.9,
    "processingTime": 1250,
    "createdAt": "2024-01-01T10:00:00.000Z"
  },
  "message": "Analysis completed successfully"
}
```

### 2. Troubleshooting Analysis (AI-Powered)

**POST** `/analyses/troubleshoot`

Get AI-powered troubleshooting help for experimental problems.

**Request Body:**

```typescript
{
  experimentId: string;        // Required
  problem: string;             // Required - Description of the problem
  context?: {                  // Optional
    protocol?: string;
    reagents?: string[];
    conditions?: Record<string, any>;
  };
}
```

**Example:**

```javascript
const troubleshoot = async (experimentId, problem, context) => {
  try {
    const response = await api.post("/analyses/troubleshoot", {
      experimentId,
      problem,
      context,
    });
    return response.data;
  } catch (error) {
    console.error("Troubleshooting failed:", error.response?.data);
    throw error;
  }
};

// Usage
await troubleshoot(
  "experiment-uuid",
  "No bands visible on gel after PCR amplification",
  {
    protocol: "Standard PCR",
    reagents: ["Taq polymerase", "dNTPs", "primers"],
    conditions: {
      annealingTemp: "58°C",
      cycles: 35,
    },
  },
);
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "analysis-uuid",
    "type": "TROUBLESHOOTING",
    "observations": [
      {
        "type": "issue_identification",
        "description": "Possible contamination or reagent degradation",
        "confidence": 0.85
      },
      {
        "type": "root_cause",
        "description": "Template DNA may be degraded or concentration too low",
        "confidence": 0.78
      }
    ],
    "recommendations": [
      {
        "action": "Check DNA quality on gel",
        "priority": "CRITICAL",
        "rationale": "Verify template integrity before proceeding",
        "estimatedTime": "30 minutes"
      },
      {
        "action": "Prepare fresh master mix",
        "priority": "HIGH",
        "rationale": "Eliminate possibility of reagent degradation",
        "estimatedTime": "15 minutes"
      }
    ],
    "nextSteps": [
      {
        "step": "Run diagnostic gel",
        "description": "Check template DNA quality"
      },
      {
        "step": "Optimize PCR conditions",
        "description": "Adjust annealing temperature and cycle number",
        "dependencies": ["Run diagnostic gel"]
      }
    ],
    "confidence": 0.82
  }
}
```

### 3. Protocol Optimization (AI-Powered)

**POST** `/analyses/optimize-protocol`

Get AI suggestions to optimize your protocol for better efficiency, cost, or results.

**Request Body:**

```typescript
{
  experimentId: string;              // Required
  currentProtocol: {                 // Required
    steps: Array<any>;
    materials: Array<any>;
    conditions: Record<string, any>;
  };
  issues?: string[];                 // Optional - Known issues to address
}
```

**Example:**

```javascript
const optimizeProtocol = async (experimentId, currentProtocol, issues) => {
  try {
    const response = await api.post("/analyses/optimize-protocol", {
      experimentId,
      currentProtocol,
      issues,
    });
    return response.data;
  } catch (error) {
    console.error("Optimization failed:", error.response?.data);
    throw error;
  }
};

// Usage
await optimizeProtocol(
  "experiment-uuid",
  {
    steps: [
      { step: 1, action: "Prepare master mix", duration: "10 min" },
      { step: 2, action: "Add template", duration: "5 min" },
      { step: 3, action: "Run PCR", duration: "2 hours" },
    ],
    materials: [{ name: "Taq polymerase", quantity: "2.5", unit: "U" }],
    conditions: {
      annealingTemp: "58°C",
      extensionTime: "1 min",
      cycles: 35,
    },
  },
  ["Takes too long", "High reagent cost"],
);
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "analysis-uuid",
    "type": "PROTOCOL_OPTIMIZATION",
    "observations": [
      {
        "type": "efficiency_analysis",
        "description": "Current protocol can be optimized for time and reagent usage",
        "confidence": 0.88
      }
    ],
    "recommendations": [
      {
        "action": "Reduce annealing time to 20 seconds",
        "priority": "MEDIUM",
        "rationale": "Shorter annealing time sufficient for primer length",
        "estimatedTime": "Saves 15 minutes per run"
      },
      {
        "action": "Use hot-start polymerase",
        "priority": "HIGH",
        "rationale": "Reduces non-specific amplification"
      }
    ],
    "nextSteps": [
      {
        "step": "Test optimized protocol",
        "description": "Run side-by-side comparison with current protocol"
      }
    ],
    "confidence": 0.85
  }
}
```

### 4. Get Analysis by ID

**GET** `/analyses/:id`

Retrieve a specific analysis by ID.

**Example:**

```javascript
const getAnalysis = async (analysisId) => {
  try {
    const response = await api.get(`/analyses/${analysisId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to get analysis:", error.response?.data);
    throw error;
  }
};
```

### 5. List Experiment Analyses

**GET** `/analyses/experiment/:experimentId`

Get all analyses for a specific experiment.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 10)

**Example:**

```javascript
const getExperimentAnalyses = async (experimentId, params = {}) => {
  try {
    const response = await api.get(`/analyses/experiment/${experimentId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to get analyses:", error.response?.data);
    throw error;
  }
};

// Usage
await getExperimentAnalyses("experiment-uuid", { page: 1, limit: 10 });
```

### 6. List User's Analyses

**GET** `/analyses/user/my-analyses`

Get all analyses requested by the current user.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 10)

**Example:**

```javascript
const getMyAnalyses = async (params = {}) => {
  try {
    const response = await api.get("/analyses/user/my-analyses", { params });
    return response.data;
  } catch (error) {
    console.error("Failed to get analyses:", error.response?.data);
    throw error;
  }
};
```

### 7. List Analyses by Type

**GET** `/analyses/type/:type`

Get analyses filtered by type.

**Valid Types:**

- `GEL_IMAGE`
- `WESTERN_BLOT`
- `CELL_MORPHOLOGY`
- `TROUBLESHOOTING`
- `PROTOCOL_OPTIMIZATION`
- `DATA_INTERPRETATION`

**Example:**

```javascript
const getAnalysesByType = async (type, params = {}) => {
  try {
    const response = await api.get(`/analyses/type/${type}`, { params });
    return response.data;
  } catch (error) {
    console.error("Failed to get analyses:", error.response?.data);
    throw error;
  }
};

// Usage
await getAnalysesByType("GEL_IMAGE", { page: 1, limit: 20 });
```

### 8. List Recent Analyses

**GET** `/analyses/recent`

Get most recent analyses across all types.

**Example:**

```javascript
const getRecentAnalyses = async (params = {}) => {
  try {
    const response = await api.get("/analyses/recent", { params });
    return response.data;
  } catch (error) {
    console.error("Failed to get analyses:", error.response?.data);
    throw error;
  }
};
```

## Data Models

### Analysis Model

```typescript
interface Analysis {
  id: string;
  experimentId: string;
  type: AnalysisType;
  inputData: Record<string, any>;
  modelUsed: string;
  observations: AnalysisObservation[];
  confidence?: number;
  recommendations: AnalysisRecommendation[];
  nextSteps: AnalysisNextStep[];
  requestedById: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  processingTime?: number;
}

interface AnalysisObservation {
  type: string;
  description: string;
  confidence?: number;
  location?: string;
  metadata?: Record<string, any>;
}

interface AnalysisRecommendation {
  action: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  rationale?: string;
  estimatedTime?: string;
  resources?: string[];
}

interface AnalysisNextStep {
  step: string;
  description: string;
  dependencies?: string[];
}
```

## Error Handling

### Common Errors

**400 Bad Request:**

```json
{
  "error": "experimentId and imageUrl are required"
}
```

**404 Not Found:**

```json
{
  "error": "Analysis not found"
}
```

**401 Unauthorized:**

```json
{
  "error": "Invalid or expired token"
}
```

## Frontend Integration Examples

### React Hook for Analysis

```javascript
// hooks/useAnalysis.js
import { useState } from "react";
import api from "../services/api";

export const useAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeGelImage = async (experimentId, imageUrl, metadata) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/analyses/gel-image", {
        experimentId,
        imageUrl,
        metadata,
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const troubleshoot = async (experimentId, problem, context) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/analyses/troubleshoot", {
        experimentId,
        problem,
        context,
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const optimizeProtocol = async (experimentId, currentProtocol, issues) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/analyses/optimize-protocol", {
        experimentId,
        currentProtocol,
        issues,
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    analyzeGelImage,
    troubleshoot,
    optimizeProtocol,
    loading,
    error,
  };
};
```

### React Component Example

```javascript
// components/GelImageAnalysis.jsx
import React, { useState } from "react";
import { useAnalysis } from "../hooks/useAnalysis";

const GelImageAnalysis = ({ experimentId }) => {
  const [imageUrl, setImageUrl] = useState("");
  const [result, setResult] = useState(null);
  const { analyzeGelImage, loading, error } = useAnalysis();

  const handleAnalyze = async () => {
    try {
      const analysis = await analyzeGelImage(experimentId, imageUrl, {
        lanes: 4,
        marker: "1kb ladder",
      });
      setResult(analysis.data);
    } catch (err) {
      console.error("Analysis failed:", err);
    }
  };

  return (
    <div className="gel-analysis">
      <h2>Gel Image Analysis</h2>

      <input
        type="text"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Enter gel image URL"
      />

      <button onClick={handleAnalyze} disabled={loading || !imageUrl}>
        {loading ? "Analyzing..." : "Analyze Image"}
      </button>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="results">
          <h3>Analysis Results</h3>
          <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>

          <h4>Observations:</h4>
          <ul>
            {result.observations.map((obs, i) => (
              <li key={i}>
                <strong>{obs.type}:</strong> {obs.description}
                {obs.confidence && ` (${(obs.confidence * 100).toFixed(1)}%)`}
              </li>
            ))}
          </ul>

          <h4>Recommendations:</h4>
          <ul>
            {result.recommendations.map((rec, i) => (
              <li key={i} className={`priority-${rec.priority.toLowerCase()}`}>
                <strong>{rec.action}</strong> - {rec.rationale}
              </li>
            ))}
          </ul>

          <h4>Next Steps:</h4>
          <ol>
            {result.nextSteps.map((step, i) => (
              <li key={i}>
                <strong>{step.step}:</strong> {step.description}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default GelImageAnalysis;
```

## Testing

### Running Backend Tests

```bash
# Start the backend server
bun run dev

# In another terminal, run the test script
node test-analysis-api.js
```

### Frontend Mock Testing

Create a mock API service for testing:

```javascript
// services/mockAnalysisApi.js
export const mockAnalysisApi = {
  analyzeGelImage: async (experimentId, imageUrl, metadata) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      data: {
        id: "mock-analysis-id",
        experimentId,
        type: "GEL_IMAGE",
        observations: [
          {
            type: "band_detection",
            description: "Clear bands visible",
            confidence: 0.92,
          },
        ],
        recommendations: [
          {
            action: "Proceed with sequencing",
            priority: "HIGH",
            rationale: "Good quality bands",
          },
        ],
        nextSteps: [
          {
            step: "Purify PCR products",
            description: "Use column purification",
          },
        ],
        confidence: 0.9,
      },
    };
  },
};
```

## Best Practices

1. **Always provide context**: Include relevant metadata for better AI analysis
2. **Handle errors gracefully**: Show user-friendly error messages
3. **Display confidence scores**: Help users understand AI certainty
4. **Show processing time**: Indicate analysis is in progress
5. **Cache results**: Avoid re-analyzing the same data
6. **Validate inputs**: Check image URLs and problem descriptions before sending

---

_Last Updated: February 23, 2026_
