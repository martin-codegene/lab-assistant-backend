import { Hono } from "hono";
import { UploadUseCases } from "@application/use-cases/upload-use-cases";
import { PrismaUploadRepository } from "@infrastructure/repositories/prisma-upload-repository";
import { getStorageAdapter } from "@infrastructure/storage/storage.adapter";
import { authMiddleware, AuthContext } from "@shared/middleware";

// ---------------------------------------------------------------------------
// Bootstrap — wired once at module load, storage adapter is lazy / singleton
// ---------------------------------------------------------------------------

const uploadRepository = new PrismaUploadRepository();

/**
 * Resolve the use-case instance.
 * We do this lazily because getStorageAdapter() is async (dynamic import).
 */
let _useCases: UploadUseCases | null = null;

async function getUseCases(): Promise<UploadUseCases> {
  if (_useCases) return _useCases;
  const adapter = await getStorageAdapter();
  _useCases = new UploadUseCases(uploadRepository, adapter);
  return _useCases;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const uploadRoutes = new Hono();

const protectedRoutes = new Hono();
protectedRoutes.use("*", authMiddleware);

// ---------------------------------------------------------------------------
// POST /
// Upload a file via multipart/form-data.
//
// Form fields:
//   file      (required) – the binary file
//   isPublic  (optional) – "true" | "false"  (defaults to false)
//
// Response 201:
//   { success: true, data: { id, name, url, key, type, size, isPublic, ... } }
//
// The `url` in the response is the resolved public/private URL that can be
// used directly to reference the file (e.g. stored in an Attachment record).
// ---------------------------------------------------------------------------
protectedRoutes.post("/", async (c: AuthContext) => {
  const user = c.get("user");

  let body: Record<string, string | File>;
  try {
    body = (await c.req.parseBody()) as Record<string, string | File>;
  } catch {
    return c.json({ error: "Failed to parse multipart body" }, 400);
  }

  const file = body["file"];

  if (!file || typeof file === "string") {
    return c.json(
      { error: 'Missing required form field "file" (must be a file)' },
      400,
    );
  }

  const isPublic = body["isPublic"] === "true";

  const useCases = await getUseCases();
  const result = await useCases.uploadFile(file as File, user.id, isPublic);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(
    {
      success: true,
      data: {
        id: result.data.id,
        name: result.data.name,
        url: result.data.url,
        key: result.data.key,
        type: result.data.type,
        size: result.data.size,
        isPublic: result.data.isPublic,
        uploaderId: result.data.uploaderId,
        createdAt: result.data.createdAt,
        updatedAt: result.data.updatedAt,
      },
      message: result.message,
    },
    201,
  );
});

// ---------------------------------------------------------------------------
// GET /my-uploads
// List all uploads belonging to the authenticated user.
// Must be declared before /:id so Hono doesn't match "my-uploads" as an id.
// ---------------------------------------------------------------------------
protectedRoutes.get("/my-uploads", async (c: AuthContext) => {
  const user = c.get("user");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");

  const useCases = await getUseCases();
  const result = await useCases.listUserUploads(user.id, { page, limit });

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// GET /public
// List all publicly accessible uploads (no auth required in principle, but
// we still keep it behind auth here to avoid unintended exposure).
// ---------------------------------------------------------------------------
protectedRoutes.get("/public", async (c: AuthContext) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");

  const useCases = await getUseCases();
  const result = await useCases.listPublicUploads({ page, limit });

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// GET /:id
// Fetch metadata for a single upload.
// ---------------------------------------------------------------------------
protectedRoutes.get("/:id", async (c: AuthContext) => {
  const id = c.req.param("id");

  const useCases = await getUseCases();
  const result = await useCases.getUploadById(id);

  if (!result.success) {
    return c.json({ error: result.error }, 404);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// PATCH /:id/make-public
// Make a file publicly accessible.
// Only the uploader may change visibility.
// ---------------------------------------------------------------------------
protectedRoutes.patch("/:id/make-public", async (c: AuthContext) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const useCases = await getUseCases();

  // Ownership guard
  const ownershipResult = await useCases.verifyOwnership(id, user.id);
  if (!ownershipResult.success) {
    const status =
      ownershipResult.error === "Upload not found" ? 404 : 403;
    return c.json({ error: ownershipResult.error }, status);
  }

  const result = await useCases.makePublic(id);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// PATCH /:id/make-private
// Restrict a file to private access.
// Only the uploader may change visibility.
// ---------------------------------------------------------------------------
protectedRoutes.patch("/:id/make-private", async (c: AuthContext) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const useCases = await getUseCases();

  // Ownership guard
  const ownershipResult = await useCases.verifyOwnership(id, user.id);
  if (!ownershipResult.success) {
    const status =
      ownershipResult.error === "Upload not found" ? 404 : 403;
    return c.json({ error: ownershipResult.error }, status);
  }

  const result = await useCases.makePrivate(id);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// DELETE /:id
// Delete an upload from both storage and the database.
// Only the uploader may delete their own file.
// ---------------------------------------------------------------------------
protectedRoutes.delete("/:id", async (c: AuthContext) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const useCases = await getUseCases();

  // Ownership guard
  const ownershipResult = await useCases.verifyOwnership(id, user.id);
  if (!ownershipResult.success) {
    const status =
      ownershipResult.error === "Upload not found" ? 404 : 403;
    return c.json({ error: ownershipResult.error }, status);
  }

  const result = await useCases.deleteUpload(id);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

uploadRoutes.route("/", protectedRoutes);
