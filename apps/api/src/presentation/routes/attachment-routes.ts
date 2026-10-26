import { Hono } from "hono";
import { AttachmentUseCases } from "@application/use-cases/attachment-use-cases";
import { PrismaAttachmentRepository } from "@infrastructure/repositories/prisma-attachment-repository";
import { PrismaExperimentRepository } from "@infrastructure/repositories/prisma-experiment-repository";
import { CreateAttachmentInput, UpdateAttachmentInput, AttachmentType } from "@domain/attachment";
import { authMiddleware, AuthContext } from "@shared/middleware";

const attachmentRepository = new PrismaAttachmentRepository();
const experimentRepository = new PrismaExperimentRepository();
const attachmentUseCases = new AttachmentUseCases(attachmentRepository, experimentRepository);

export const attachmentRoutes = new Hono();

const protectedRoutes = new Hono();
protectedRoutes.use("*", authMiddleware);

// ---------------------------------------------------------------------------
// POST /
// Register a new attachment (metadata only — the file itself is hosted
// externally, e.g. S3). The caller supplies the resolved public URL.
// ---------------------------------------------------------------------------
protectedRoutes.post("/", async (c: AuthContext) => {
  try {
    const user = c.get("user");
    const body = await c.req.json<CreateAttachmentInput>();

    const result = await attachmentUseCases.createAttachment({
      ...body,
      uploadedById: user.id,
    });

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result, 201);
  } catch (error) {
    console.error("Create attachment error:", error);
    return c.json({ error: "Invalid request body" }, 400);
  }
});

// ---------------------------------------------------------------------------
// GET /user/my-attachments
// List all attachments uploaded by the authenticated user.
// Must be defined before /:id so Hono does not treat "my-attachments" as an id.
// ---------------------------------------------------------------------------
protectedRoutes.get("/user/my-attachments", async (c: AuthContext) => {
  const user = c.get("user");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const type = c.req.query("type") as AttachmentType | undefined;

  if (type && !Object.values(AttachmentType).includes(type)) {
    return c.json({ error: "Invalid attachment type" }, 400);
  }

  const result = await attachmentUseCases.listUserAttachments(
    user.id,
    { page, limit },
    type ? { type } : undefined,
  );

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// GET /experiment/:experimentId
// List all attachments for a specific experiment.
// Supports optional ?type= filter.
// ---------------------------------------------------------------------------
protectedRoutes.get("/experiment/:experimentId", async (c: AuthContext) => {
  const experimentId = c.req.param("experimentId");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const type = c.req.query("type") as AttachmentType | undefined;

  if (type && !Object.values(AttachmentType).includes(type)) {
    return c.json({ error: "Invalid attachment type" }, 400);
  }

  const result = await attachmentUseCases.listExperimentAttachments(
    experimentId,
    { page, limit },
    type ? { type } : undefined,
  );

  if (!result.success) {
    return c.json({ error: result.error }, 404);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// GET /type/:type
// List all attachments of a given type across all experiments.
// ---------------------------------------------------------------------------
protectedRoutes.get("/type/:type", async (c: AuthContext) => {
  const type = c.req.param("type") as AttachmentType;
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");

  if (!Object.values(AttachmentType).includes(type)) {
    return c.json({ error: "Invalid attachment type" }, 400);
  }

  const result = await attachmentUseCases.listAttachmentsByType(type, {
    page,
    limit,
  });

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// GET /:id
// Fetch a single attachment by its ID.
// ---------------------------------------------------------------------------
protectedRoutes.get("/:id", async (c: AuthContext) => {
  const id = c.req.param("id");
  const result = await attachmentUseCases.getAttachmentById(id);

  if (!result.success) {
    return c.json({ error: result.error }, 404);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// PUT /:id
// Update mutable fields (description, thumbnailUrl).
// Only the uploader may edit their attachment.
// ---------------------------------------------------------------------------
protectedRoutes.put("/:id", async (c: AuthContext) => {
  const id = c.req.param("id");
  const user = c.get("user");

  // Ownership check
  const ownershipResult = await attachmentUseCases.verifyOwnership(id, user.id);
  if (!ownershipResult.success) {
    const status = ownershipResult.error === "Attachment not found" ? 404 : 403;
    return c.json({ error: ownershipResult.error }, status);
  }

  try {
    const body = await c.req.json<UpdateAttachmentInput>();
    const result = await attachmentUseCases.updateAttachment(id, body);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result);
  } catch (error) {
    return c.json({ error: "Invalid request body" }, 400);
  }
});

// ---------------------------------------------------------------------------
// DELETE /:id
// Delete an attachment. Only the uploader may delete their own attachment.
// ---------------------------------------------------------------------------
protectedRoutes.delete("/:id", async (c: AuthContext) => {
  const id = c.req.param("id");
  const user = c.get("user");

  // Ownership check
  const ownershipResult = await attachmentUseCases.verifyOwnership(id, user.id);
  if (!ownershipResult.success) {
    const status = ownershipResult.error === "Attachment not found" ? 404 : 403;
    return c.json({ error: ownershipResult.error }, status);
  }

  const result = await attachmentUseCases.deleteAttachment(id);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// DELETE /experiment/:experimentId/all
// Bulk-delete every attachment on an experiment.
// Only the experiment owner should do this (caller is responsible for
// checking experiment ownership before calling this route).
// ---------------------------------------------------------------------------
protectedRoutes.delete("/experiment/:experimentId/all", async (c: AuthContext) => {
  const experimentId = c.req.param("experimentId");

  const result = await attachmentUseCases.deleteExperimentAttachments(experimentId);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

attachmentRoutes.route("/", protectedRoutes);
