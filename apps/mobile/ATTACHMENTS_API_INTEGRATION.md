# Attachments API — Integration Guide

> **Base path:** `/api/attachments`
> **Auth:** Every endpoint requires a `Bearer` token in the `Authorization` header.

---

## Overview

The Attachments API manages file metadata records that are **scoped to an Experiment**. An attachment is the *link* between an experiment and a file that lives in external storage (e.g. AWS S3). You first upload the file using the [Uploads API](./UPLOAD_API_INTEGRATION.md), receive a URL, then register that URL here as an attachment on the target experiment.

```
POST /api/uploads          ← push bytes to storage, get back a URL
POST /api/attachments      ← register that URL against an experiment
```

---

## Data Model

```ts
interface Attachment {
  id:           string;          // UUID
  experimentId: string;          // UUID of the parent experiment
  type:         AttachmentType;  // see enum below
  fileName:     string;          // original file name (max 255 chars)
  fileSize:     number;          // size in bytes
  mimeType:     string;          // e.g. "image/jpeg"
  url:          string;          // publicly accessible URL of the file
  thumbnailUrl?: string;         // optional preview URL
  description?: string;          // optional note (max 1000 chars)
  uploadedById: string;          // UUID of the user who created this record
  uploadedAt:   string;          // ISO 8601 timestamp

  // Populated on fetch
  experiment?:  Experiment;
  uploadedBy?:  User;
}
```

### AttachmentType enum

| Value | Description |
|---|---|
| `IMAGE` | Gel images, microscopy photos, western blot scans |
| `VIDEO` | Time-lapse recordings, microscopy videos |
| `DOCUMENT` | PDFs, Word documents, spreadsheets, plain text |
| `DATA_FILE` | JSON exports, CSV data, XML results, raw binary |
| `AUDIO` | Voice notes, lab dictation |

### Allowed MIME types per type

| AttachmentType | Allowed MIME types |
|---|---|
| `IMAGE` | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/tiff`, `image/bmp` |
| `VIDEO` | `video/mp4`, `video/webm`, `video/quicktime`, `video/x-msvideo` |
| `DOCUMENT` | `application/pdf`, `application/msword`, `.docx`, `application/vnd.ms-excel`, `.xlsx`, `text/plain`, `text/csv` |
| `DATA_FILE` | `application/json`, `text/csv`, `text/plain`, `application/xml`, `text/xml`, `application/octet-stream` |
| `AUDIO` | `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/webm`, `audio/aac` |

### File size limits

| AttachmentType | Max size |
|---|---|
| `IMAGE` | 20 MB |
| `VIDEO` | 500 MB |
| `DOCUMENT` | 50 MB |
| `DATA_FILE` | 100 MB |
| `AUDIO` | 100 MB |

---

## Endpoints

### 1. Register an Attachment

Creates an attachment metadata record. The file must already be hosted at the provided `url` — this endpoint does **not** accept binary data.

```
POST /api/attachments
Content-Type: application/json
Authorization: Bearer <token>
```

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `experimentId` | `string` | ✅ | UUID of the experiment to attach the file to |
| `type` | `AttachmentType` | ✅ | One of the enum values above |
| `fileName` | `string` | ✅ | Original file name, max 255 chars |
| `fileSize` | `number` | ✅ | File size in bytes, must be > 0 |
| `mimeType` | `string` | ✅ | MIME type — must be on the allowed list for the given `type` |
| `url` | `string` | ✅ | Fully qualified URL where the file is accessible |
| `thumbnailUrl` | `string` | ❌ | Optional preview image URL |
| `description` | `string` | ❌ | Optional note, max 1000 chars |

**Example request**

```json
{
  "experimentId": "e3b7c2a1-1234-5678-abcd-000000000001",
  "type": "IMAGE",
  "fileName": "gel_run_01.png",
  "fileSize": 2457600,
  "mimeType": "image/png",
  "url": "https://my-bucket.s3.amazonaws.com/uploads/user-id/uuid.png",
  "thumbnailUrl": "https://my-bucket.s3.amazonaws.com/uploads/user-id/uuid_thumb.png",
  "description": "Gel electrophoresis — run 1, samples A–F"
}
```

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-0000-0000-0000-000000000001",
    "experimentId": "e3b7c2a1-1234-5678-abcd-000000000001",
    "type": "IMAGE",
    "fileName": "gel_run_01.png",
    "fileSize": 2457600,
    "mimeType": "image/png",
    "url": "https://my-bucket.s3.amazonaws.com/uploads/user-id/uuid.png",
    "thumbnailUrl": "https://my-bucket.s3.amazonaws.com/uploads/user-id/uuid_thumb.png",
    "description": "Gel electrophoresis — run 1, samples A–F",
    "uploadedById": "u1u2u3u4-0000-0000-0000-000000000001",
    "uploadedAt": "2025-01-15T10:30:00.000Z"
  },
  "message": "Attachment created successfully"
}
```

**Error responses**

| Status | `error` | Cause |
|---|---|---|
| `400` | `"Experiment not found"` | `experimentId` does not exist |
| `400` | `"MIME type \"video/mp4\" is not allowed for attachment type IMAGE"` | MIME / type mismatch |
| `400` | `"File size exceeds the maximum allowed size for VIDEO (500 MB)"` | File too large |
| `400` | `"File URL is not a valid URL"` | Malformed `url` |
| `401` | `"No token provided"` | Missing `Authorization` header |

---

### 2. Get Attachment by ID

```
GET /api/attachments/:id
Authorization: Bearer <token>
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-0000-0000-0000-000000000001",
    "experimentId": "e3b7c2a1-1234-5678-abcd-000000000001",
    "type": "IMAGE",
    "fileName": "gel_run_01.png",
    "fileSize": 2457600,
    "mimeType": "image/png",
    "url": "https://my-bucket.s3.amazonaws.com/uploads/user-id/uuid.png",
    "thumbnailUrl": "https://my-bucket.s3.amazonaws.com/uploads/user-id/uuid_thumb.png",
    "description": "Gel electrophoresis — run 1, samples A–F",
    "uploadedById": "u1u2u3u4-0000-0000-0000-000000000001",
    "uploadedAt": "2025-01-15T10:30:00.000Z",
    "uploadedBy": {
      "id": "u1u2u3u4-0000-0000-0000-000000000001",
      "name": "Dr. Jane Smith",
      "email": "jane@lab.example.com",
      "role": "RESEARCHER"
    }
  }
}
```

**Error responses**

| Status | `error` | Cause |
|---|---|---|
| `404` | `"Attachment not found"` | No record with that `id` |

---

### 3. Update Attachment

Only `description` and `thumbnailUrl` are mutable. Only the uploader may update their own attachment.

```
PUT /api/attachments/:id
Content-Type: application/json
Authorization: Bearer <token>
```

**Request body** _(all fields optional)_

| Field | Type | Description |
|---|---|---|
| `description` | `string` | New description (max 1000 chars). Pass `""` to clear it. |
| `thumbnailUrl` | `string` | New thumbnail URL. Must be a valid URL. |

**Example request**

```json
{
  "description": "Updated label: gel run 1 — lanes 1–6 confirmed clean"
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-0000-0000-0000-000000000001",
    "description": "Updated label: gel run 1 — lanes 1–6 confirmed clean",
    "...": "other fields unchanged"
  },
  "message": "Attachment updated successfully"
}
```

**Error responses**

| Status | `error` | Cause |
|---|---|---|
| `403` | `"You do not have permission to modify this attachment"` | Authenticated user is not the uploader |
| `404` | `"Attachment not found"` | No record with that `id` |
| `400` | `"Description must be less than 1000 characters"` | Validation failure |

---

### 4. Delete Attachment

Removes the metadata record only. The underlying file in storage is **not** deleted by this endpoint — use the [Uploads API delete](#6-delete-an-upload) for that if needed.

```
DELETE /api/attachments/:id
Authorization: Bearer <token>
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": null,
  "message": "Attachment deleted successfully"
}
```

**Error responses**

| Status | `error` | Cause |
|---|---|---|
| `403` | `"You do not have permission to modify this attachment"` | Authenticated user is not the uploader |
| `404` | `"Attachment not found"` | No record with that `id` |

---

### 5. List Attachments for an Experiment

Returns all attachments belonging to the given experiment, newest first. Supports an optional `type` filter.

```
GET /api/attachments/experiment/:experimentId
Authorization: Bearer <token>
```

**Query parameters**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `20` | Items per page |
| `type` | `AttachmentType` | — | Filter by attachment type |

**Example**

```
GET /api/attachments/experiment/e3b7c2a1-1234-5678-abcd-000000000001?type=IMAGE&page=1&limit=10
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "a1b2c3d4-0000-0000-0000-000000000001",
        "experimentId": "e3b7c2a1-1234-5678-abcd-000000000001",
        "type": "IMAGE",
        "fileName": "gel_run_01.png",
        "fileSize": 2457600,
        "mimeType": "image/png",
        "url": "https://my-bucket.s3.amazonaws.com/uploads/user-id/uuid.png",
        "uploadedById": "u1u2u3u4-0000-0000-0000-000000000001",
        "uploadedAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

**Error responses**

| Status | `error` | Cause |
|---|---|---|
| `404` | `"Experiment not found"` | `experimentId` does not exist |
| `400` | `"Invalid attachment type"` | Unrecognized `type` query value |

---

### 6. List My Attachments

Returns all attachments uploaded by the authenticated user across all experiments.

```
GET /api/attachments/user/my-attachments
Authorization: Bearer <token>
```

**Query parameters**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `20` | Items per page |
| `type` | `AttachmentType` | — | Optional type filter |

**Example**

```
GET /api/attachments/user/my-attachments?page=1&limit=20
```

**Response `200 OK`** — same paginated shape as above.

---

### 7. List Attachments by Type

Returns all attachments of a given type across all experiments.

```
GET /api/attachments/type/:type
Authorization: Bearer <token>
```

**Path parameter**

| Param | Description |
|---|---|
| `type` | One of `IMAGE`, `VIDEO`, `DOCUMENT`, `DATA_FILE`, `AUDIO` |

**Query parameters**

| Param | Type | Default |
|---|---|---|
| `page` | `number` | `1` |
| `limit` | `number` | `20` |

**Example**

```
GET /api/attachments/type/DATA_FILE?page=1&limit=20
```

**Response `200 OK`** — same paginated shape as above.

**Error responses**

| Status | `error` | Cause |
|---|---|---|
| `400` | `"Invalid attachment type"` | Unrecognized `:type` path param |

---

### 8. Bulk Delete Experiment Attachments

Deletes **all** attachment records for an experiment in one call. Intended for use when deleting an experiment entirely.

```
DELETE /api/attachments/experiment/:experimentId/all
Authorization: Bearer <token>
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": null,
  "message": "All experiment attachments deleted successfully"
}
```

---

## Common Patterns

### Recommended upload → attach flow

```
1. POST /api/uploads          (multipart/form-data, field: file)
   → { data: { url, key, id, ... } }

2. POST /api/attachments      (application/json)
   Body: { experimentId, type, fileName, fileSize, mimeType, url }
   → { data: { id, ... } }
```

### Displaying images in a React Native / web frontend

```ts
// After fetching experiment attachments:
const images = attachments.filter(a => a.type === 'IMAGE');

// Use the url field directly in an <Image> component
<Image source={{ uri: attachment.url }} />

// For previewable items use thumbnailUrl first if available
const previewUrl = attachment.thumbnailUrl ?? attachment.url;
```

### Checking if an attachment is previewable

An attachment is considered directly previewable (inline render) when its type is `IMAGE` or `VIDEO`. All other types should be opened in an external viewer or downloaded.

```ts
function isPreviewable(attachment: Attachment): boolean {
  return attachment.type === 'IMAGE' || attachment.type === 'VIDEO';
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