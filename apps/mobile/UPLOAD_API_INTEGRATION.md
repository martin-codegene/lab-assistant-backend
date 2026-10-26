# Uploads API — Integration Guide

> **Base path:** `/api/uploads`
> **Auth:** Every endpoint requires a `Bearer` token in the `Authorization` header.

---

## Overview

The Uploads API handles the full lifecycle of binary file storage. It accepts raw files via `multipart/form-data`, pushes the bytes to the configured storage backend (AWS S3 in production, local disk in development), persists the metadata to the database, and returns a resolved URL that can be used immediately — for example, as the `url` field when registering an [Attachment](./ATTACHMENTS_API_INTEGRATION.md).

### Two-API architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Mobile / Web)                  │
└───────────────┬─────────────────────────────────────────────┘
                │
                │  1. POST /api/uploads   (multipart/form-data)
                │     → receives { url, key, id, ... }
                │
                │  2. POST /api/attachments  (application/json)
                │     Body: { experimentId, url, fileName, ... }
                │
┌───────────────▼─────────────────────────────────────────────┐
│                       Lab App Backend                        │
│                                                              │
│   Upload Use Case ──► Storage Adapter ──► S3 / Local Disk   │
│         │                                                    │
│         └──► Prisma Upload Repository ──► PostgreSQL         │
└─────────────────────────────────────────────────────────────┘
```

> **Rule of thumb:** Use `/api/uploads` to store bytes and get a URL. Use `/api/attachments` to associate that URL with an experiment.

---

## Storage Backends

The active storage backend is selected at runtime via the `STORAGE_DRIVER` environment variable.

| `STORAGE_DRIVER` | Adapter | Use case |
|---|---|---|
| `local` *(default)* | `LocalStorageAdapter` | Local development — files saved to `<project-root>/uploads/` and served at `http://localhost:3000/uploads/<key>` |
| `aws` | `AwsStorageAdapter` | Production — files stored in the configured AWS S3 bucket |

### Storage key format

Every uploaded file is stored under a deterministic, collision-resistant key:

```
uploads/{uploaderId}/{uuid}.{ext}

Example:
  uploads/u1b2c3d4-0000-0000-0000-000000000001/f47ac10b-58cc-4372-a567-0e02b2c3d479.png
```

### Environment variables

**Required for `aws` driver:**

| Variable | Description |
|---|---|
| `STORAGE_DRIVER` | Set to `"aws"` |
| `AWS_S3_BUCKET` | Target S3 bucket name |
| `AWS_REGION` | Bucket region (defaults to `us-east-1`) |

**Optional (local dev with explicit credentials only):**

| Variable | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS access key — not needed on Lambda (uses execution role) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key — not needed on Lambda (uses execution role) |

**For `local` driver:**

| Variable | Description |
|---|---|
| `PORT` | Port the dev server runs on (defaults to `3000`) |

---

## Data Model

```ts
interface Upload {
  id:          string;   // UUID
  name:        string;   // original file name (max 255 chars)
  url:         string;   // resolved URL returned by the storage adapter
  key:         string;   // unique storage key (e.g. "uploads/userId/uuid.jpg")
  type:        string;   // MIME type (e.g. "image/jpeg")
  size:        number;   // file size in bytes
  uploaderId:  string;   // UUID of the authenticated user who uploaded the file
  isPublic:    boolean;  // whether the file is publicly accessible
  createdAt:   string;   // ISO 8601 timestamp
  updatedAt:   string;   // ISO 8601 timestamp

  // Populated on fetch
  uploader?:   User;
}
```

---

## Endpoints

### 1. Upload a File

Accepts a file via `multipart/form-data`, pushes it to storage, persists the metadata record, and returns the resolved URL.

```
POST /api/uploads
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Form fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | `File` | ✅ | The binary file to upload |
| `isPublic` | `"true"` \| `"false"` | ❌ | Whether to make the file publicly accessible. Defaults to `"false"` |

**Example — fetch (browser / React Native)**

```ts
const formData = new FormData();
formData.append('file', file);          // file is a File / Blob object
formData.append('isPublic', 'false');   // optional, defaults to false

const response = await fetch('https://api.example.com/api/uploads', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    // Do NOT set Content-Type manually — the browser sets it with the boundary
  },
  body: formData,
});

const { data } = await response.json();
console.log(data.url);  // use this URL in /api/attachments
```

**Example — curl**

```bash
curl -X POST https://api.example.com/api/uploads \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/gel_run_01.png" \
  -F "isPublic=false"
```

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": "f1a2b3c4-0000-0000-0000-000000000001",
    "name": "gel_run_01.png",
    "url": "https://my-bucket.s3.amazonaws.com/uploads/u1b2c3d4/uuid.png",
    "key": "uploads/u1b2c3d4-0000-0000-0000-000000000001/f47ac10b-58cc-4372-a567-0e02b2c3d479.png",
    "type": "image/png",
    "size": 2457600,
    "isPublic": false,
    "uploaderId": "u1b2c3d4-0000-0000-0000-000000000001",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  },
  "message": "File uploaded successfully"
}
```

> **Important:** Save the `url` and optionally the `id` and `key` from this response. You will need the `url` when calling `POST /api/attachments`.

**Error responses**

| Status | `error` | Cause |
|---|---|---|
| `400` | `"Missing required form field \"file\" (must be a file)"` | `file` field absent or sent as plain text |
| `400` | `"No file provided or file is empty"` | File has zero bytes |
| `400` | `"Failed to parse multipart body"` | Malformed `Content-Type` or body |
| `400` | `"File name is required"` | File object has no name |
| `401` | `"No token provided"` | Missing `Authorization` header |
| `401` | `"Invalid or expired token"` | Token failed verification |

---

### 2. Get Upload by ID

Fetches the metadata record for a single upload.

```
GET /api/uploads/:id
Authorization: Bearer <token>
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "f1a2b3c4-0000-0000-0000-000000000001",
    "name": "gel_run_01.png",
    "url": "https://my-bucket.s3.amazonaws.com/uploads/u1b2c3d4/uuid.png",
    "key": "uploads/u1b2c3d4-0000-0000-0000-000000000001/f47ac10b-58cc-4372-a567-0e02b2c3d479.png",
    "type": "image/png",
    "size": 2457600,
    "isPublic": false,
    "uploaderId": "u1b2c3d4-0000-0000-0000-000000000001",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z",
    "uploader": {
      "id": "u1b2c3d4-0000-0000-0000-000000000001",
      "name": "Dr. Jane Smith",
      "email": "jane@lab.example.com",
      "role": "RESEARCHER",
      "plan": "PRO"
    }
  }
}
```

**Error responses**

| Status | `error` | Cause |
|---|---|---|
| `404` | `"Upload not found"` | No record with that `id` |

---

### 3. List My Uploads

Returns all uploads belonging to the authenticated user, newest first.

```
GET /api/uploads/my-uploads
Authorization: Bearer <token>
```

**Query parameters**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Page number (1-based) |
| `limit` | `number` | `20` | Items per page |

**Example**

```
GET /api/uploads/my-uploads?page=1&limit=20
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "f1a2b3c4-0000-0000-0000-000000000001",
        "name": "gel_run_01.png",
        "url": "https://my-bucket.s3.amazonaws.com/uploads/u1b2c3d4/uuid.png",
        "key": "uploads/u1b2c3d4/uuid.png",
        "type": "image/png",
        "size": 2457600,
        "isPublic": false,
        "uploaderId": "u1b2c3d4-0000-0000-0000-000000000001",
        "createdAt": "2025-01-15T10:30:00.000Z",
        "updatedAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 4. List Public Uploads

Returns all uploads that have been made publicly accessible, newest first.

```
GET /api/uploads/public
Authorization: Bearer <token>
```

**Query parameters**

| Param | Type | Default |
|---|---|---|
| `page` | `number` | `1` |
| `limit` | `number` | `20` |

**Response `200 OK`** — same paginated shape as above.

---

### 5. Make an Upload Public

Updates the storage ACL and the database record to make the file publicly accessible. Returns the new public URL.

```
PATCH /api/uploads/:id/make-public
Authorization: Bearer <token>
```

No request body required.

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "f1a2b3c4-0000-0000-0000-000000000001",
    "isPublic": true,
    "url": "https://my-bucket.s3.amazonaws.com/uploads/u1b2c3d4/uuid.png",
    "updatedAt": "2025-01-15T11:00:00.000Z",
    "...": "other fields unchanged"
  },
  "message": "Upload is now public"
}
```

> If the upload is already public, the response returns `200` with `message: "Already public"` and no changes are applied.

**Error responses**

| Status | `error` | Cause |
|---|---|---|
| `403` | `"You do not have permission to modify this upload"` | Authenticated user is not the uploader |
| `404` | `"Upload not found"` | No record with that `id` |

---

### 6. Make an Upload Private

Reverts the storage ACL and updates the database record to restrict access.

```
PATCH /api/uploads/:id/make-private
Authorization: Bearer <token>
```

No request body required.

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "f1a2b3c4-0000-0000-0000-000000000001",
    "isPublic": false,
    "updatedAt": "2025-01-15T11:05:00.000Z",
    "...": "other fields unchanged"
  },
  "message": "Upload is now private"
}
```

> If the upload is already private, the response returns `200` with `message: "Already private"` and no changes are applied.

**Error responses**

| Status | `error` | Cause |
|---|---|---|
| `403` | `"You do not have permission to modify this upload"` | Authenticated user is not the uploader |
| `404` | `"Upload not found"` | No record with that `id` |

---

### 7. Delete an Upload

Removes the file from storage **and** deletes the metadata record from the database. Only the uploader may delete their own file.

```
DELETE /api/uploads/:id
Authorization: Bearer <token>
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": null,
  "message": "Upload deleted successfully"
}
```

> **Storage deletion is best-effort.** If the file cannot be removed from S3 (e.g. a network error), the error is logged but the database record is still deleted. This prevents orphaned metadata while allowing the storage to be cleaned up manually if needed.

**Error responses**

| Status | `error` | Cause |
|---|---|---|
| `403` | `"You do not have permission to modify this upload"` | Authenticated user is not the uploader |
| `404` | `"Upload not found"` | No record with that `id` |

---

## Common Patterns

### Full upload-then-attach flow

```ts
// Step 1 — Upload the binary file
const formData = new FormData();
formData.append('file', pickedFile);
formData.append('isPublic', 'false');

const uploadRes = await fetch(`${API_BASE}/api/uploads`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
const { data: upload } = await uploadRes.json();
// upload.url is now a valid S3 / local URL

// Step 2 — Register the URL as an experiment attachment
const attachRes = await fetch(`${API_BASE}/api/attachments`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    experimentId: currentExperimentId,
    type: 'IMAGE',
    fileName: pickedFile.name,
    fileSize: pickedFile.size,
    mimeType: pickedFile.type,
    url: upload.url,
  }),
});
const { data: attachment } = await attachRes.json();
```

### Uploading from React Native (Expo)

```ts
import * as ImagePicker from 'expo-image-picker';

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
});

if (!result.canceled) {
  const asset = result.assets[0];

  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: asset.fileName ?? 'photo.jpg',
    type: asset.mimeType ?? 'image/jpeg',
  } as any);

  const response = await fetch(`${API_BASE}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const { data } = await response.json();
  console.log('Uploaded:', data.url);
}
```

### Uploading multiple files

Each file must be sent in a **separate** `POST /api/uploads` request. The API does not support batch binary uploads in a single request.

```ts
const uploadedUrls = await Promise.all(
  files.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/uploads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const { data } = await res.json();
    return data.url;
  })
);
```

### Deleting a file and its attachment record together

```ts
// Delete the storage file + upload record
await fetch(`${API_BASE}/api/uploads/${uploadId}`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${token}` },
});

// Delete the attachment metadata record
await fetch(`${API_BASE}/api/attachments/${attachmentId}`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## Local Development Setup

When `STORAGE_DRIVER` is `local` (or unset), files are written to `<project-root>/uploads/` and served over a static route that the dev server registers automatically.

```bash
# .env (local dev)
STORAGE_DRIVER=local
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/labapp
JWT_SECRET=your-dev-secret
```

Start the dev server:

```bash
bun run dev
```

Uploaded files will be accessible at:

```
http://localhost:3000/uploads/{uploaderId}/{uuid}.{ext}
```

---

## Production Setup (AWS S3)

```bash
# .env (production / Lambda)
STORAGE_DRIVER=aws
AWS_S3_BUCKET=lab-app-files-prod
AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are NOT needed on Lambda —
# the execution role's credentials are used automatically.
```

### Recommended S3 bucket configuration

| Setting | Recommended value |
|---|---|
| Block all public access | **ON** by default. Only disable per-object when `makePublic` is called. |
| Versioning | Optional — enables recovery of overwritten files |
| Lifecycle policy | Auto-delete objects older than N days for `uploads/temp/` prefix if you add a temporary upload flow |
| CORS | Allow `PUT` / `POST` / `GET` from your frontend domain |

### Minimal IAM policy for the Lambda execution role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::lab-app-files-prod/*"
    }
  ]
}
```

---

## Error Response Shape

All error responses follow this consistent shape:

```json
{
  "error": "Human-readable error message"
}
```

## Authentication Errors

| Status | `error` | Cause |
|---|---|---|
| `401` | `"No token provided"` | `Authorization` header missing |
| `401` | `"Invalid or expired token"` | Token failed verification |
| `403` | `"Insufficient permissions"` | Role does not satisfy route guard |

---

## Endpoint Summary

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/uploads` | Upload a file — returns `url` |
| `GET` | `/api/uploads/my-uploads` | List authenticated user's uploads |
| `GET` | `/api/uploads/public` | List all public uploads |
| `GET` | `/api/uploads/:id` | Get upload metadata by ID |
| `PATCH` | `/api/uploads/:id/make-public` | Make a file publicly accessible |
| `PATCH` | `/api/uploads/:id/make-private` | Restrict a file to private access |
| `DELETE` | `/api/uploads/:id` | Delete file from storage + database |