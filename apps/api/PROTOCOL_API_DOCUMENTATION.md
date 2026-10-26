# Protocol Management API Documentation

## Overview

The Protocol Management API provides comprehensive endpoints for creating, managing, and discovering laboratory protocols. Protocols define the step-by-step procedures for experiments, including materials, conditions, and safety notes.

## Base URL

```
http://localhost:3000/api/protocols
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Protocol Data Model

```typescript
interface Protocol {
  id: string;                    // UUID
  name: string;                  // Protocol name
  description?: string;          // Protocol description
  category: ProtocolCategory;    // Protocol category
  version: string;               // Version number (e.g., "1.0.0")
  isPublic: boolean;             // Public visibility
  isTemplate: boolean;           // Template flag
  materials: ProtocolMaterial[]; // Required materials
  steps: ProtocolStep[];         // Protocol steps
  conditions: ProtocolConditions; // Experimental conditions
  safetyNotes?: string;          // Safety information
  references?: string;           // References
  createdById: string;           // Creator user ID
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  lastUsedAt?: Date;             // Last usage timestamp
  usageCount: number;            // Usage count
  createdBy?: UserPublic;        // Creator user (populated)
}

interface ProtocolMaterial {
  name: string;                  // Material name
  quantity: string;              // Quantity
  unit: string;                  // Unit of measurement
  catalogNumber?: string;        // Catalog number
  supplier?: string;             // Supplier name
}

interface ProtocolStep {
  step: number;                  // Step number (sequential)
  action: string;                // Action description
  duration: string;              // Duration
  notes?: string;                // Additional notes
  materials?: string[];          // Materials for this step
}

interface ProtocolConditions {
  temperature?: string;          // Temperature
  time?: string;                 // Time
  pH?: string;                   // pH level
  pressure?: string;             // Pressure
  cycles?: string;               // Number of cycles
  other?: Record<string, string>; // Other conditions
}

enum ProtocolCategory {
  PCR = "PCR",
  WESTERN_BLOT = "WESTERN_BLOT",
  CELL_CULTURE = "CELL_CULTURE",
  PROTEIN_EXPRESSION = "PROTEIN_EXPRESSION",
  DNA_SEQUENCING = "DNA_SEQUENCING",
  MICROSCOPY = "MICROSCOPY",
  FLOW_CYTOMETRY = "FLOW_CYTOMETRY",
  ELISA = "ELISA",
  OTHER = "OTHER"
}
```

## API Endpoints

### 1. Create Protocol

**POST** `/protocols` (Protected)

Create a new protocol.

**Request Body:**
```json
{
  "name": "Standard PCR Protocol",
  "description": "Basic PCR amplification protocol",
  "category": "PCR",
  "version": "1.0.0",
  "isPublic": true,
  "isTemplate": false,
  "materials": [
    {
      "name": "Template DNA",
      "quantity": "100",
      "unit": "ng",
      "catalogNumber": "DNA-001",
      "supplier": "Thermo Fisher"
    },
    {
      "name": "Taq Polymerase",
      "quantity": "1",
      "unit": "U",
      "catalogNumber": "TAQ-001"
    }
  ],
  "steps": [
    {
      "step": 1,
      "action": "Prepare master mix on ice",
      "duration": "10 min",
      "notes": "Keep all reagents cold",
      "materials": ["Taq Polymerase", "Buffer", "dNTPs"]
    },
    {
      "step": 2,
      "action": "Add template DNA",
      "duration": "5 min"
    },
    {
      "step": 3,
      "action": "Run PCR cycles",
      "duration": "2 hours",
      "notes": "95°C initial denaturation for 2 min"
    }
  ],
  "conditions": {
    "temperature": "95°C",
    "time": "2 hours",
    "cycles": "35"
  },
  "safetyNotes": "Wear appropriate PPE. Handle reagents carefully.",
  "references": "Standard molecular biology protocols"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "protocol-uuid",
    "name": "Standard PCR Protocol",
    "description": "Basic PCR amplification protocol",
    "category": "PCR",
    "version": "1.0.0",
    "isPublic": true,
    "isTemplate": false,
    "materials": [...],
    "steps": [...],
    "conditions": {...},
    "safetyNotes": "Wear appropriate PPE. Handle reagents carefully.",
    "references": "Standard molecular biology protocols",
    "createdById": "user-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "usageCount": 0
  },
  "message": "Protocol created successfully"
}
```

**Example (JavaScript):**
```javascript
const createProtocol = async (protocolData) => {
  const response = await api.post('/protocols', protocolData);
  return response.data;
};

await createProtocol({
  name: 'My PCR Protocol',
  category: 'PCR',
  materials: [...],
  steps: [...],
  conditions: {...}
});
```

---

### 2. Get Protocol by ID

**GET** `/protocols/:id` (Public)

Get protocol details by ID.

**Parameters:**
- `id` (path) - Protocol UUID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "protocol-uuid",
    "name": "Standard PCR Protocol",
    "description": "Basic PCR amplification protocol",
    "category": "PCR",
    "version": "1.0.0",
    "isPublic": true,
    "isTemplate": false,
    "materials": [...],
    "steps": [...],
    "conditions": {...},
    "safetyNotes": "Wear appropriate PPE.",
    "references": "Standard protocols",
    "createdById": "user-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lastUsedAt": "2024-01-02T00:00:00.000Z",
    "usageCount": 5,
    "createdBy": {
      "id": "user-uuid",
      "email": "researcher@lab.com",
      "name": "John Researcher",
      "role": "RESEARCHER",
      "plan": "PRO"
    }
  }
}
```

**Example:**
```javascript
const getProtocol = async (protocolId) => {
  const response = await api.get(`/protocols/${protocolId}`);
  return response.data;
};
```

---

### 3. Update Protocol

**PUT** `/protocols/:id` (Protected)

Update an existing protocol.

**Parameters:**
- `id` (path) - Protocol UUID

**Request Body:**
```json
{
  "name": "Updated Protocol Name",
  "description": "Updated description",
  "isPublic": false,
  "materials": [...],
  "steps": [...],
  "conditions": {...}
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "protocol-uuid",
    "name": "Updated Protocol Name",
    ...
  },
  "message": "Protocol updated successfully"
}
```

**Example:**
```javascript
const updateProtocol = async (protocolId, updates) => {
  const response = await api.put(`/protocols/${protocolId}`, updates);
  return response.data;
};

await updateProtocol('protocol-uuid', {
  name: 'New Protocol Name',
  isPublic: true
});
```

---

### 4. Delete Protocol

**DELETE** `/protocols/:id` (Protected)

Delete a protocol.

**Parameters:**
- `id` (path) - Protocol UUID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Protocol deleted successfully"
}
```

**Example:**
```javascript
const deleteProtocol = async (protocolId) => {
  const response = await api.delete(`/protocols/${protocolId}`);
  return response.data;
};
```

---

### 5. List User's Protocols

**GET** `/protocols/user/my-protocols` (Protected)

Get paginated list of protocols created by the authenticated user.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `category` (ProtocolCategory, optional) - Filter by category
- `isPublic` (boolean, optional) - Filter by public/private
- `isTemplate` (boolean, optional) - Filter by template status

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "data