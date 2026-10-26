import { Hono } from "hono";
import { AmazonNovaService } from "@infrastructure/services/amazon-nova-service";
import { ChatMessage } from "@infrastructure/services/ai-service.interface";
import { authMiddleware, AuthContext } from "@shared/middleware";
import { ChatUseCases } from "@application/use-cases/chat-use-cases";
import { PrismaChatRepository } from "@infrastructure/repositories/prisma-chat-repository";
import { CreateChatSessionInput, UpdateChatSessionInput } from "@domain/chat";

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const aiService = new AmazonNovaService();
const chatRepository = new PrismaChatRepository();
const chatUseCases = new ChatUseCases(chatRepository, aiService);

// ---------------------------------------------------------------------------
// Router setup
// ---------------------------------------------------------------------------

export const chatRoutes = new Hono();

const protectedRoutes = new Hono();
protectedRoutes.use("*", authMiddleware);

// ===========================================================================
// LEGACY — Stateless chat (no history, kept for backwards compatibility)
// POST /api/chat
// ===========================================================================

protectedRoutes.post("/", async (c: AuthContext) => {
  try {
    const { messages } = await c.req.json<{ messages: ChatMessage[] }>();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: "messages array is required" }, 400);
    }

    const systemMessage: ChatMessage = {
      role: "system",
      content:
        "You are the Lab Assistant AI. Help the user with lab protocols, experiments, analysis, and troubleshooting.",
    };

    const result = await aiService.chat([systemMessage, ...messages]);

    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Chat route error:", error);
    return c.json({ error: "Invalid request body" }, 400);
  }
});

// ===========================================================================
// SESSION CRUD
// ===========================================================================

// ---------------------------------------------------------------------------
// POST /api/chat/sessions
// Create a new chat session.
//
// Body (all optional):
//   title        – human-readable name (auto-generated from first message if omitted)
//   experimentId – pin session to an experiment
//   protocolId   – pin session to a protocol
// ---------------------------------------------------------------------------
protectedRoutes.post("/sessions", async (c: AuthContext) => {
  try {
    const user = c.get("user");
    const body = await c.req
      .json<Omit<CreateChatSessionInput, "userId">>()
      .catch(() => ({}));

    const result = await chatUseCases.createSession({
      ...body,
      userId: user.id,
    });

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result, 201);
  } catch (error) {
    console.error("Create chat session error:", error);
    return c.json({ error: "Failed to create chat session" }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /api/chat/sessions
// List all sessions for the authenticated user, newest-updated first.
// Each item includes the last message as a preview.
//
// Query params:
//   page  (default 1)
//   limit (default 20)
// ---------------------------------------------------------------------------
protectedRoutes.get("/sessions", async (c: AuthContext) => {
  const user = c.get("user");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");

  const result = await chatUseCases.listUserSessions(user.id, { page, limit });

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// GET /api/chat/sessions/:id
// Fetch a single session with all of its messages.
// ---------------------------------------------------------------------------
protectedRoutes.get("/sessions/:id", async (c: AuthContext) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const result = await chatUseCases.getSessionWithMessages(id, user.id);

  if (!result.success) {
    const status = result.error === "Chat session not found" ? 404 : 403;
    return c.json({ error: result.error }, status);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// PATCH /api/chat/sessions/:id
// Update a session's title, experimentId, or protocolId.
// Only the session owner may update.
//
// Body (all optional):
//   title        – new title (max 255 chars)
//   experimentId – new experimentId, or null to unlink
//   protocolId   – new protocolId, or null to unlink
// ---------------------------------------------------------------------------
protectedRoutes.patch("/sessions/:id", async (c: AuthContext) => {
  const user = c.get("user");
  const id = c.req.param("id");

  try {
    const body = await c.req.json<UpdateChatSessionInput>();
    const result = await chatUseCases.updateSession(id, user.id, body);

    if (!result.success) {
      const status = result.error === "Chat session not found" ? 404 : 403;
      return c.json({ error: result.error }, status);
    }

    return c.json(result);
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/chat/sessions/:id
// Delete a session and all of its messages.
// Only the session owner may delete.
// ---------------------------------------------------------------------------
protectedRoutes.delete("/sessions/:id", async (c: AuthContext) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const result = await chatUseCases.deleteSession(id, user.id);

  if (!result.success) {
    const status = result.error === "Chat session not found" ? 404 : 403;
    return c.json({ error: result.error }, status);
  }

  return c.json(result);
});

// ===========================================================================
// MESSAGING
// ===========================================================================

// ---------------------------------------------------------------------------
// POST /api/chat/sessions/:id/messages
// Send a user message to a session.
//
// The server will:
//   1. Persist the user message.
//   2. Load the full history and call the AI (with a system prompt prepended).
//   3. Persist the AI reply.
//   4. Auto-title the session from the first message if it's still "New Chat".
//   5. Return the AI reply + the updated session metadata.
//
// Body:
//   content (string, required) – the user's message text
// ---------------------------------------------------------------------------
protectedRoutes.post("/sessions/:id/messages", async (c: AuthContext) => {
  const user = c.get("user");
  const sessionId = c.req.param("id");

  try {
    const { content } = await c.req.json<{ content: string }>();

    if (!content || typeof content !== "string") {
      return c.json({ error: '"content" (string) is required' }, 400);
    }

    const result = await chatUseCases.sendMessage(sessionId, user.id, content);

    if (!result.success) {
      const status =
        result.error === "Chat session not found"
          ? 404
          : result.error?.includes("permission")
            ? 403
            : 400;
      return c.json({ error: result.error }, status);
    }

    return c.json(result, 201);
  } catch (error) {
    console.error("Send message error:", error);
    return c.json({ error: "Invalid request body" }, 400);
  }
});

// ---------------------------------------------------------------------------
// GET /api/chat/sessions/:id/messages
// Get paginated messages for a session, oldest first.
//
// Query params:
//   page  (default 1)
//   limit (default 50)
// ---------------------------------------------------------------------------
protectedRoutes.get("/sessions/:id/messages", async (c: AuthContext) => {
  const user = c.get("user");
  const sessionId = c.req.param("id");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "50");

  const result = await chatUseCases.getMessages(sessionId, user.id, {
    page,
    limit,
  });

  if (!result.success) {
    const status = result.error === "Chat session not found" ? 404 : 403;
    return c.json({ error: result.error }, status);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// DELETE /api/chat/sessions/:id/messages
// Clear all messages from a session without deleting the session itself.
// The session title is reset to "New Chat".
// Only the session owner may clear.
// ---------------------------------------------------------------------------
protectedRoutes.delete("/sessions/:id/messages", async (c: AuthContext) => {
  const user = c.get("user");
  const sessionId = c.req.param("id");

  const result = await chatUseCases.clearMessages(sessionId, user.id);

  if (!result.success) {
    const status = result.error === "Chat session not found" ? 404 : 403;
    return c.json({ error: result.error }, status);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

chatRoutes.route("/", protectedRoutes);
