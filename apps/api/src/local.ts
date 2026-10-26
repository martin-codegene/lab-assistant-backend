import { Hono } from "hono";
import { upgradeWebSocket, websocket } from "hono/bun";
import { userRoutes } from "@presentation/routes/user-routes";
import { protocolRoutes } from "@presentation/routes/protocol-routes";
import { experimentRoutes } from "@presentation/routes/experiment-routes";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { analysisRoutes } from "@presentation/routes/analysis-routes";
import { chatRoutes } from "@presentation/routes/chat-routes";
import { attachmentRoutes } from "@presentation/routes/attachment-routes";
import { uploadRoutes } from "@presentation/routes/upload-routes";
import { transcribeRoutes } from "@presentation/routes/transcribe-routes";

const app = new Hono();


// Middleware
app.use("*", cors());
app.use(logger());

// Health check
app.get("/", (c) => {
  return c.json({
    message: "Lab Assistant AI API",
    version: "1.0.0",
    status: "healthy",
  });
});

// API routes
app.route("/api/users", userRoutes);
app.route("/api/protocols", protocolRoutes);
app.route("/api/experiments", experimentRoutes);
app.route("/api/analyses", analysisRoutes);
app.route("/api/chat", chatRoutes);
app.route("/api/attachments", attachmentRoutes);
app.route("/api/uploads", uploadRoutes);
app.route("/api/transcribe", transcribeRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Route not found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

const port = Number(process.env.PORT ?? 3000);

export default {
  fetch: app.fetch, // ✅ must be app.fetch, not app
  port,
  websocket
}