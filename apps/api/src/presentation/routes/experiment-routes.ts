import { Hono, Context } from "hono";
import { stream } from "hono/streaming";
import { ExperimentUseCases } from "@application/use-cases/experiment-use-cases";
import { PrismaExperimentRepository } from "@infrastructure/repositories/prisma-experiment-repository";
import { PrismaProtocolRepository } from "@infrastructure/repositories/prisma-protocol-repository";
import { NovaAIService } from "@infrastructure/services/nova-ai.service";
import { experimentWebSocketHandler } from "@infrastructure/websocket/experiment.socket";
import {
  CreateExperimentInput,
  UpdateExperimentInput,
  ExperimentStatus,
} from "@domain/experiment";
import { authMiddleware, AuthContext } from "@shared/middleware";
import { createNodeWebSocket } from "@hono/node-ws";
import { upgradeWebSocket } from "hono/bun";


const experimentRepository = new PrismaExperimentRepository();
const protocolRepository = new PrismaProtocolRepository();
const realtimeAIService = new NovaAIService("us-east-1");
const experimentUseCases = new ExperimentUseCases(
  experimentRepository,
  protocolRepository,
  realtimeAIService,
);

export const experimentRoutes = new Hono();

// Create a protected route group
const protectedRoutes = new Hono();
protectedRoutes.use("*", authMiddleware);

// Protected routes
// Create experiment (plan a new experiment)
protectedRoutes.post("/", async (c: AuthContext) => {
  try {
    const input = await c.req.json<CreateExperimentInput>();
    const user = c.get("user");

    const result = await experimentUseCases.createExperiment({
      ...input,
      createdById: user.id,
    });

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result, 201);
  } catch (error) {
    console.error("Create experiment error:", error);
    return c.json({ error: "Invalid request body" }, 400);
  }
});

// Get experiment by ID
protectedRoutes.get("/:id", async (c: AuthContext) => {
  const id = c.req.param("id");
  const result = await experimentUseCases.getExperimentById(id);

  if (!result.success) {
    return c.json({ error: result.error }, 404);
  }

  return c.json(result);
});

// Get experiment with analyses
protectedRoutes.get("/:id/analyses", async (c: AuthContext) => {
  const id = c.req.param("id");
  const result = await experimentUseCases.getExperimentWithAnalyses(id);

  if (!result.success) {
    return c.json({ error: result.error }, 404);
  }

  return c.json(result);
});

// Update experiment
protectedRoutes.put("/:id", async (c: AuthContext) => {
  const id = c.req.param("id");

  try {
    const input = await c.req.json<UpdateExperimentInput>();
    const result = await experimentUseCases.updateExperiment(id, input);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result);
  } catch (error) {
    return c.json({ error: "Invalid request body" }, 400);
  }
});

// Delete experiment
protectedRoutes.delete("/:id", async (c: AuthContext) => {
  const id = c.req.param("id");
  const result = await experimentUseCases.deleteExperiment(id);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

// List user's experiments
protectedRoutes.get("/user/my-experiments", async (c: AuthContext) => {
  const userId = c.get("user").id;
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "10");
  const status = c.req.query("status") as ExperimentStatus | undefined;
  const protocolId = c.req.query("protocolId");
  const labId = c.req.query("labId");

  const result = await experimentUseCases.listUserExperiments(
    userId,
    { page, limit },
    { status, protocolId, labId },
  );

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

// List experiments by protocol
protectedRoutes.get("/protocol/:protocolId", async (c: AuthContext) => {
  const protocolId = c.req.param("protocolId");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "10");

  const result = await experimentUseCases.listProtocolExperiments(protocolId, {
    page,
    limit,
  });

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

// List experiments by lab
protectedRoutes.get("/lab/:labId", async (c: AuthContext) => {
  const labId = c.req.param("labId");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "10");
  const status = c.req.query("status") as ExperimentStatus | undefined;

  const result = await experimentUseCases.listLabExperiments(
    labId,
    { page, limit },
    { status },
  );

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

// Search experiments
protectedRoutes.get("/search", async (c: AuthContext) => {
  const query = c.req.query("q");
  const userId = c.get("user").id;
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "10");

  if (!query) {
    return c.json({ error: "Search query is required" }, 400);
  }

  const result = await experimentUseCases.searchExperiments(query, userId, {
    page,
    limit,
  });

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

// Start experiment (begin running the protocol)
protectedRoutes.post("/:id/start", async (c: AuthContext) => {
  const id = c.req.param("id");
  const result = await experimentUseCases.startExperiment(id);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result);
});

// Complete experiment
protectedRoutes.post("/:id/complete", async (c: AuthContext) => {
  const id = c.req.param("id");

  try {
    const { success, conclusion } = await c.req.json<{
      success: boolean;
      conclusion?: string;
    }>();

    if (success === undefined) {
      return c.json({ error: "Success status is required" }, 400);
    }

    const result = await experimentUseCases.completeExperiment(
      id,
      success,
      conclusion,
    );

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result);
  } catch (error) {
    return c.json({ error: "Invalid request body" }, 400);
  }
});

// Fail experiment
protectedRoutes.post("/:id/fail", async (c: AuthContext) => {
  const id = c.req.param("id");

  try {
    const { reason } = await c.req.json<{ reason?: string }>();
    const result = await experimentUseCases.failExperiment(id, reason);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result);
  } catch (error) {
    return c.json({ error: "Invalid request body" }, 400);
  }
});

// Cancel experiment
protectedRoutes.post("/:id/cancel", async (c: AuthContext) => {
  const id = c.req.param("id");

  try {
    const { reason } = await c.req.json<{ reason?: string }>();
    const result = await experimentUseCases.cancelExperiment(id, reason);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result);
  } catch (error) {
    return c.json({ error: "Invalid request body" }, 400);
  }
});

// WebSocket endpoint for real-time experiment guidance
protectedRoutes.get(
  "/:experimentId/guidance",
  upgradeWebSocket((c: AuthContext) => {
    const experimentId = c.req.param("experimentId");
    const protocolId = c.req.query("protocolId");
    const user = c.get("user");
    console.log(
      `[Guidance WebSocket] Upgrade request for experiment ${experimentId}, protocol ${protocolId}, user ${user?.id}`,
    );

    return {
      onOpen(event: any, ws: any) {
        if (!protocolId) {
          ws.close(1008, "protocolId query parameter is required");
          return;
        }

        console.log(
          `[Guidance WebSocket] User ${user?.id} connected for experiment ${experimentId}`,
        );

        // Send initial connection confirmation
        ws.send(
          JSON.stringify({
            type: "connected",
            experimentId,
            protocolId,
            userId: user?.id || "anonymous",
            timestamp: Date.now(),
          }),
        );
      },

      async onMessage(event: any, ws: any) {
        const userId = user?.id || "anonymous";
        try {
          const data = event.data.toString();

          console.log(
            `[Guidance WebSocket] Message received from ${userId}: ${data.substring(0, 100)}`,
          );

          await experimentWebSocketHandler.handleMessage(data, ws);
        } catch (error) {
          console.error("[Guidance WebSocket] Message handling error:", error);
          try {
            ws.send(
              JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : "Failed to process message",
                timestamp: Date.now(),
              }),
            );
          } catch (sendError) {
            console.error("[Guidance WebSocket] Failed to send error:", sendError);
          }
        }
      },

      onClose(event: any, ws: any) {
        console.log(
          `[Guidance WebSocket] User ${user?.id || "anonymous"} disconnected from experiment ${experimentId}`,
        );
      },

      onError(event: any, ws: any) {
        console.error(
          `[Guidance WebSocket] Connection error for user ${user?.id || "anonymous"}:`,
          event,
        );
      },
    };
  }),
);

// Mount protected routes under experimentRoutes
experimentRoutes.route("/", protectedRoutes);
