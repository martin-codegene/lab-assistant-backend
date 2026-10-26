import { Pagination, PaginatedResult, ApiResponse } from "@shared/types";
import { IChatSessionRepository } from "@domain/repositories";
import { IAIService, ChatMessage } from "@infrastructure/services/ai-service.interface";
import {
  ChatSessionEntity,
  ChatSessionMessageEntity,
  ChatSession,
  ChatSessionMessage,
  ChatMessageRole,
  CreateChatSessionInput,
  UpdateChatSessionInput,
} from "@domain/chat";

// System prompt injected at the top of every AI request — never stored in DB
const SYSTEM_PROMPT =
  "You are the Lab Assistant AI. Help the user with lab protocols, experiments, analysis, and troubleshooting.";

export class ChatUseCases {
  constructor(
    private chatRepository: IChatSessionRepository,
    private aiService: IAIService,
  ) {}

  // ─── Session CRUD ───────────────────────────────────────────────────────────

  /**
   * Create a new, empty chat session.
   */
  async createSession(
    input: CreateChatSessionInput,
  ): Promise<ApiResponse<ChatSessionEntity>> {
    try {
      const session = ChatSessionEntity.create(input);

      const validation = session.validate();
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(", ") };
      }

      await this.chatRepository.save(session);

      return {
        success: true,
        data: session,
        message: "Chat session created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create chat session",
      };
    }
  }

  /**
   * Get a session by ID (without messages).
   * Verifies that the session belongs to the requesting user.
   */
  async getSessionById(
    id: string,
    userId: string,
  ): Promise<ApiResponse<ChatSessionEntity>> {
    try {
      const session = await this.chatRepository.findById(id);
      if (!session) {
        return { success: false, error: "Chat session not found" };
      }

      if (session.userId !== userId) {
        return {
          success: false,
          error: "You do not have permission to access this session",
        };
      }

      return { success: true, data: new ChatSessionEntity(session) };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get chat session",
      };
    }
  }

  /**
   * Get a session by ID with all of its messages included.
   * Verifies ownership.
   */
  async getSessionWithMessages(
    id: string,
    userId: string,
  ): Promise<ApiResponse<ChatSessionEntity>> {
    try {
      const session = await this.chatRepository.findWithMessages(id);
      if (!session) {
        return { success: false, error: "Chat session not found" };
      }

      if (session.userId !== userId) {
        return {
          success: false,
          error: "You do not have permission to access this session",
        };
      }

      return { success: true, data: new ChatSessionEntity(session) };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get chat session with messages",
      };
    }
  }

  /**
   * List all sessions for the given user, newest first.
   * Messages are NOT included — use getSessionWithMessages for that.
   */
  async listUserSessions(
    userId: string,
    pagination?: Pagination,
  ): Promise<ApiResponse<PaginatedResult<ChatSessionEntity>>> {
    try {
      const result = await this.chatRepository.findByUser(userId, pagination);

      return {
        success: true,
        data: {
          ...result,
          data: result.data.map((s) => new ChatSessionEntity(s)),
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list chat sessions",
      };
    }
  }

  /**
   * Update a session's title or context (experimentId / protocolId).
   * Verifies ownership.
   */
  async updateSession(
    id: string,
    userId: string,
    input: UpdateChatSessionInput,
  ): Promise<ApiResponse<ChatSessionEntity>> {
    try {
      const raw = await this.chatRepository.findById(id);
      if (!raw) {
        return { success: false, error: "Chat session not found" };
      }

      if (raw.userId !== userId) {
        return {
          success: false,
          error: "You do not have permission to modify this session",
        };
      }

      const session = new ChatSessionEntity(raw);
      session.updateContext(input);

      const validation = session.validate();
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(", ") };
      }

      await this.chatRepository.save(session);

      return {
        success: true,
        data: session,
        message: "Chat session updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update chat session",
      };
    }
  }

  /**
   * Delete a session and all of its messages (cascade).
   * Verifies ownership.
   */
  async deleteSession(
    id: string,
    userId: string,
  ): Promise<ApiResponse<void>> {
    try {
      const session = await this.chatRepository.findById(id);
      if (!session) {
        return { success: false, error: "Chat session not found" };
      }

      if (session.userId !== userId) {
        return {
          success: false,
          error: "You do not have permission to delete this session",
        };
      }

      await this.chatRepository.delete(id);

      return {
        success: true,
        data: undefined,
        message: "Chat session deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete chat session",
      };
    }
  }

  // ─── Messaging ──────────────────────────────────────────────────────────────

  /**
   * Send a user message to an existing session:
   *  1. Verify session ownership.
   *  2. Persist the user message to the DB.
   *  3. Load the full message history and call the AI.
   *  4. Persist the assistant reply to the DB.
   *  5. Auto-title the session from the first message if it is still "New Chat".
   *  6. Return both the assistant reply and the updated session.
   */
  async sendMessage(
    sessionId: string,
    userId: string,
    content: string,
  ): Promise<
    ApiResponse<{ reply: ChatSessionMessage; session: ChatSessionEntity }>
  > {
    try {
      if (!content || content.trim().length === 0) {
        return { success: false, error: "Message content cannot be empty" };
      }

      if (content.length > 32_000) {
        return {
          success: false,
          error: "Message content must be less than 32,000 characters",
        };
      }

      // 1 — verify session ownership
      const raw = await this.chatRepository.findById(sessionId);
      if (!raw) {
        return { success: false, error: "Chat session not found" };
      }
      if (raw.userId !== userId) {
        return {
          success: false,
          error: "You do not have permission to send messages to this session",
        };
      }

      const session = new ChatSessionEntity(raw);

      // 2 — persist the user message
      const userMessage = await this.chatRepository.addMessage({
        sessionId,
        role: ChatMessageRole.USER,
        content: content.trim(),
      });

      // 3 — load full history and build the AI request
      const allMessages = await this.chatRepository.getAllMessages(sessionId);

      const aiMessages: ChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...allMessages.map((m) => ({
          role: m.role === ChatMessageRole.USER ? "user" : ("assistant" as ChatMessage["role"]),
          content: m.content,
        })),
      ];

      const aiResult = await this.aiService.chat(aiMessages);

      // 4 — persist the assistant reply
      const assistantMessage = await this.chatRepository.addMessage({
        sessionId,
        role: ChatMessageRole.ASSISTANT,
        content: aiResult.message.content,
      });

      // 5 — auto-title on first message
      if (session.title === "New Chat") {
        session.generateTitleFromMessage(content);
        await this.chatRepository.save(session);
      } else {
        // Still bump updatedAt so sessions sort correctly
        session.updatedAt = new Date();
        await this.chatRepository.save(session);
      }

      return {
        success: true,
        data: {
          reply: assistantMessage,
          session: new ChatSessionEntity({
            ...session.toJSON(),
            updatedAt: session.updatedAt,
          }),
        },
        message: "Message sent successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to send message",
      };
    }
  }

  /**
   * Get a paginated list of messages for a session.
   * Verifies ownership.
   */
  async getMessages(
    sessionId: string,
    userId: string,
    pagination?: Pagination,
  ): Promise<ApiResponse<PaginatedResult<ChatSessionMessage>>> {
    try {
      const session = await this.chatRepository.findById(sessionId);
      if (!session) {
        return { success: false, error: "Chat session not found" };
      }

      if (session.userId !== userId) {
        return {
          success: false,
          error: "You do not have permission to view this session",
        };
      }

      const result = await this.chatRepository.getMessages(
        sessionId,
        pagination,
      );

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get messages",
      };
    }
  }

  /**
   * Delete all messages in a session, leaving the session itself intact.
   * Verifies ownership.
   */
  async clearMessages(
    sessionId: string,
    userId: string,
  ): Promise<ApiResponse<void>> {
    try {
      const session = await this.chatRepository.findById(sessionId);
      if (!session) {
        return { success: false, error: "Chat session not found" };
      }

      if (session.userId !== userId) {
        return {
          success: false,
          error: "You do not have permission to modify this session",
        };
      }

      await this.chatRepository.deleteMessages(sessionId);

      // Reset the title back to default since the context is gone
      const sessionEntity = new ChatSessionEntity(session);
      sessionEntity.updateTitle("New Chat");
      await this.chatRepository.save(sessionEntity);

      return {
        success: true,
        data: undefined,
        message: "Chat history cleared successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to clear messages",
      };
    }
  }
}
