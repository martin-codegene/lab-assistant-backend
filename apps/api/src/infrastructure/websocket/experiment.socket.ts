// WebSocket Handler for Real-Time Experiment Guidance
// Bridges WebSocket connections with real-time AI streaming via use cases
// Handles frame/audio input → use cases → realtime AI provider → WebSocket output

import { HonoRequest } from "hono";
import { ExperimentUseCases } from "@application/use-cases/experiment-use-cases";
import { PrismaExperimentRepository } from "@infrastructure/repositories/prisma-experiment-repository";
import { PrismaProtocolRepository } from "@infrastructure/repositories/prisma-protocol-repository";
import { createRealtimeAIService } from "@infrastructure/ai/ai-provider.factory";
import { IRealtimeAIService } from "@infrastructure/ai/ai-service.interface";

// Session state for tracking active WebSocket connections
interface WebSocketSession {
  experimentId: string;
  protocolId: string;
  userId: string;
  startTime: Date;
  isActive: boolean;
}

// Message types for WebSocket protocol
export interface WSMessage {
  type:
    | "start_guidance"
    | "send_frame"
    | "send_audio"
    | "interrupt"
    | "end_session"
    | "error";
  experimentId?: string;
  protocolId?: string;
  userId?: string;
  frameData?: string; // base64 encoded
  audioData?: string; // base64 encoded
  mimeType?: string;
  systemContext?: string;
  timestamp?: number;
}

export interface WSResponse {
  type:
    | "guidance"
    | "text_delta"
    | "audio_chunk"
    | "session_started"
    | "session_ended"
    | "error"
    | "ack";
  content?: string;
  streamId?: string;
  timestamp: number;
  sessionActive?: boolean;
  error?: string;
}

/**
 * ExperimentWebSocketHandler
 *
 * Manages real-time experiment guidance via WebSocket.
 * Orchestrates the flow: WebSocket → Use Cases → Realtime AI provider
 *
 * Usage:
 * const handler = new ExperimentWebSocketHandler()
 * ws.addEventListener('message', (event) =>
 *   handler.handleMessage(event.data, ws)
 * )
 */
export class ExperimentWebSocketHandler {
  private sessions = new Map<string, WebSocketSession>();
  private experimentUseCases: ExperimentUseCases;
  private realtimeAIService: IRealtimeAIService;
  private activeWs: WebSocket | any = null

  constructor() {
    // Initialize repositories and services
    const experimentRepository = new PrismaExperimentRepository();
    const protocolRepository = new PrismaProtocolRepository();
    this.realtimeAIService = createRealtimeAIService();

    // Inject real-time AI service into use cases
    this.experimentUseCases = new ExperimentUseCases(
      experimentRepository,
      protocolRepository,
      this.realtimeAIService,
    );

    // Register response callbacks that stream back to client
    this.setupAICallbacks();
  }

  /**
   * Setup callbacks from AI service to broadcast responses to WebSocket clients
   */
  private setupAICallbacks() {
    // Text guidance is collected and sent as chunks
    this.experimentUseCases.onGuidanceText((textChunk: string) => {
      // Text chunks will be broadcast by caller after receiving them
      console.log(`[WebSocket] Text delta: ${textChunk.substring(0, 50)}...`);
    });

    // Audio responses can be sent back in real-time
    this.experimentUseCases.onGuidanceAudio((audioChunk: Buffer) => {
      console.log(`[WebSocket] Audio chunk received: ${audioChunk.length} bytes`);
      // Audio chunks will be broadcast by caller
      // In ExperimentWebSocketHandler.setupAICallbacks():
      this.broadcastAudioChunk(this.activeWs, audioChunk); // need to store ws ref
    });
  }

  /**
   * Main message handler for incoming WebSocket messages
   * Routes messages to appropriate handlers based on type
   */
  async handleMessage(
    rawMessage: string | ArrayBuffer,
    ws: WebSocket | any,
  ): Promise<void> {
    try {
      let message: WSMessage;

      if (typeof rawMessage === "string") {
        message = JSON.parse(rawMessage);
      } else {
        // Handle binary data
        const textData = new TextDecoder().decode(rawMessage);
        message = JSON.parse(textData);
      }

      const timestamp = Date.now();

      switch (message.type) {
        case "start_guidance":
          await this.handleStartGuidance(message, ws, timestamp);
          break;

        case "send_frame":
          await this.handleSendFrame(message, ws, timestamp);
          break;

        case "send_audio":
          await this.handleSendAudio(message, ws, timestamp);
          break;

        case "interrupt":
          await this.handleInterrupt(ws, timestamp);
          break;

        case "end_session":
          await this.handleEndSession(message, ws, timestamp);
          break;

        default:
          this.sendError(ws, `Unknown message type: ${message.type}`, timestamp);
      }
    } catch (error) {
      const timestamp = Date.now();
      console.error("[WebSocket] Error handling message:", error);
      this.sendError(
        ws,
        error instanceof Error ? error.message : "Unknown error",
        timestamp,
      );
    }
  }

  /**
   * Start a real-time guidance session
   * Initializes the AI service with protocol context
   */
  private async handleStartGuidance(
    message: WSMessage,
    ws: WebSocket | any,
    timestamp: number,
  ): Promise<void> {
    const { experimentId, protocolId, systemContext, userId } = message;

    if (!experimentId || !protocolId) {
      this.sendError(
        ws,
        "experimentId and protocolId required",
        timestamp,
      );
      return;
    }

    // Create session entry
    const sessionId = `${experimentId}-${Date.now()}`;
    const session: WebSocketSession = {
      experimentId,
      protocolId,
      userId: userId || "anonymous",
      startTime: new Date(),
      isActive: true,
    };
    
    this.activeWs = ws;
    this.sessions.set(sessionId, session);

    try {
      // Start guidance session with use case
      const result = await this.experimentUseCases.streamExperimentGuidance(
        experimentId,
        protocolId,
        systemContext,
      );

      if (!result.success) {
        this.sessions.delete(sessionId);
        this.sendError(ws, result.error || "Failed to start session", timestamp);
        return;
      }

      // Send acknowledgment
      const response: WSResponse = {
        type: "session_started",
        streamId: sessionId,
        sessionActive: true,
        timestamp,
      };

      this.send(ws, response);
      console.log(`[WebSocket] Session started: ${sessionId}`);
    } catch (error) {
      this.sessions.delete(sessionId);
      this.sendError(
        ws,
        error instanceof Error ? error.message : "Failed to start session",
        timestamp,
      );
    }
  }

  /**
   * Send a video frame for analysis and guidance
   */
  private async handleSendFrame(
    message: WSMessage,
    ws: WebSocket | any,
    timestamp: number,
  ): Promise<void> {
    const { frameData, mimeType } = message;

    if (!frameData) {
      this.sendError(ws, "frameData required", timestamp);
      return;
    }

    try {
      const result = await this.experimentUseCases.sendLiveFrame(
        frameData,
        mimeType || "image/jpeg",
      );

      if (!result.success) {
        this.sendError(ws, result.error || "Failed to send frame", timestamp);
        return;
      }

      // Acknowledge receipt
      const response: WSResponse = {
        type: "ack",
        timestamp,
      };

      this.send(ws, response);
    } catch (error) {
      this.sendError(
        ws,
        error instanceof Error ? error.message : "Frame processing error",
        timestamp,
      );
    }
  }

  /**
   * Send audio input for voice-enabled guidance
   */
  private async handleSendAudio(
    message: WSMessage,
    ws: WebSocket | any,
    timestamp: number,
  ): Promise<void> {
    const { audioData } = message;

    if (!audioData) {
      this.sendError(ws, "audioData required", timestamp);
      return;
    }

    try {
      const result = await this.experimentUseCases.sendLiveAudio(audioData);

      if (!result.success) {
        this.sendError(ws, result.error || "Failed to send audio", timestamp);
        return;
      }

      // Acknowledge receipt
      const response: WSResponse = {
        type: "ack",
        timestamp,
      };

      this.send(ws, response);
    } catch (error) {
      this.sendError(
        ws,
        error instanceof Error ? error.message : "Audio processing error",
        timestamp,
      );
    }
  }

  /**
   * Interrupt the current AI response
   */
  private async handleInterrupt(
    ws: WebSocket | any,
    timestamp: number,
  ): Promise<void> {
    try {
      const result = await this.experimentUseCases.interruptGuidance();

      if (!result.success) {
        this.sendError(ws, result.error || "Failed to interrupt", timestamp);
        return;
      }

      const response: WSResponse = {
        type: "ack",
        timestamp,
      };

      this.send(ws, response);
    } catch (error) {
      this.sendError(
        ws,
        error instanceof Error ? error.message : "Interrupt error",
        timestamp,
      );
    }
  }

  /**
   * End the guidance session and cleanup
   */
  private async handleEndSession(
    message: WSMessage,
    ws: WebSocket | any,
    timestamp: number,
  ): Promise<void> {
    try {
      const result = await this.experimentUseCases.endGuidanceSession();

      if (!result.success) {
        this.sendError(ws, result.error || "Failed to end session", timestamp);
      }

      // Mark all sessions as inactive
      this.sessions.forEach((session) => {
        session.isActive = false;
      });

      const response: WSResponse = {
        type: "session_ended",
        timestamp,
      };

      this.send(ws, response);
      console.log("[WebSocket] Session ended");
    } catch (error) {
      this.sendError(
        ws,
        error instanceof Error ? error.message : "Session end error",
        timestamp,
      );
    }
  }

  /**
   * Broadcast guidance response text to WebSocket client
   * Can be called from external stream handler
   */
  broadcastGuidanceText(ws: WebSocket | any, text: string): void {
    const response: WSResponse = {
      type: "text_delta",
      content: text,
      timestamp: Date.now(),
    };

    this.send(ws, response);
  }

  /**
   * Broadcast audio response to WebSocket client
   * Can be called from external stream handler
   */
  broadcastAudioChunk(ws: WebSocket | any, chunk: Buffer): void {
    const response: WSResponse = {
      type: "audio_chunk",
      content: chunk.toString("base64"),
      timestamp: Date.now(),
    };

    this.send(ws, response);
  }

  /**
   * Send JSON response over WebSocket
   */
  private send(ws: WebSocket | any, response: WSResponse): void {
    try {
      const data =
        ws.send instanceof Function ? ws.send : ws.readyState === 1
          ? ws.send
          : null;

      if (data) {
        ws.send(JSON.stringify(response));
      }
    } catch (error) {
      console.error("[WebSocket] Failed to send message:", error);
    }
  }

  /**
   * Send error response
   */
  private sendError(
    ws: WebSocket | any,
    error: string,
    timestamp: number,
  ): void {
    const response: WSResponse = {
      type: "error",
      error,
      timestamp,
    };

    this.send(ws, response);
  }

  /**
   * Cleanup session on disconnect
   */
  cleanupSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      console.log(`[WebSocket] Session cleaned up: ${sessionId}`);
      // Session remains in map for historical reference
    }
    this.activeWs = null;
  }

  /**
   * Get session info for monitoring
   */
  getSessionInfo(sessionId: string): WebSocketSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): WebSocketSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.isActive);
  }
}

// Export singleton instance for reuse across routes
export const experimentWebSocketHandler = new ExperimentWebSocketHandler();
