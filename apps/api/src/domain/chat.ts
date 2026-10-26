import { BaseEntity } from "@shared/types";
import { User } from "./user";
import { Experiment } from "./experiment";
import { Protocol } from "./protocol";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ChatMessageRole {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ChatSessionMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: Date;
}

export interface ChatSession extends BaseEntity {
  userId: string;
  title: string;

  // Optional context — a session can be pinned to an experiment or protocol
  experimentId?: string;
  protocolId?: string;

  // Relations (populated when fetched)
  user?: User;
  experiment?: Experiment;
  protocol?: Protocol;
  messages?: ChatSessionMessage[];
}

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreateChatSessionInput {
  userId: string;
  title?: string;
  experimentId?: string;
  protocolId?: string;
}

export interface UpdateChatSessionInput {
  title?: string;
  experimentId?: string | null;
  protocolId?: string | null;
}

export interface CreateChatMessageInput {
  sessionId: string;
  role: ChatMessageRole;
  content: string;
}

// ─── ChatSessionMessage Entity ────────────────────────────────────────────────

export class ChatSessionMessageEntity implements ChatSessionMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: Date;

  constructor(data: ChatSessionMessage) {
    this.id = data.id;
    this.sessionId = data.sessionId;
    this.role = data.role;
    this.content = data.content;
    this.createdAt = data.createdAt;
  }

  static create(input: CreateChatMessageInput): ChatSessionMessageEntity {
    return new ChatSessionMessageEntity({
      id: crypto.randomUUID(),
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      createdAt: new Date(),
    });
  }

  isFromUser(): boolean {
    return this.role === ChatMessageRole.USER;
  }

  isFromAssistant(): boolean {
    return this.role === ChatMessageRole.ASSISTANT;
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.sessionId) {
      errors.push("Session ID is required");
    }

    if (!this.content || this.content.trim().length === 0) {
      errors.push("Message content cannot be empty");
    }

    if (this.content && this.content.length > 32_000) {
      errors.push("Message content must be less than 32,000 characters");
    }

    if (!Object.values(ChatMessageRole).includes(this.role)) {
      errors.push(`Invalid role. Must be one of: ${Object.values(ChatMessageRole).join(", ")}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  toJSON(): ChatSessionMessage {
    return {
      id: this.id,
      sessionId: this.sessionId,
      role: this.role,
      content: this.content,
      createdAt: this.createdAt,
    };
  }
}

// ─── ChatSession Entity ───────────────────────────────────────────────────────

export class ChatSessionEntity implements ChatSession {
  id: string;
  userId: string;
  title: string;
  experimentId?: string;
  protocolId?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  user?: User;
  experiment?: Experiment;
  protocol?: Protocol;
  messages?: ChatSessionMessage[];

  constructor(data: ChatSession) {
    this.id = data.id;
    this.userId = data.userId;
    this.title = data.title;
    this.experimentId = data.experimentId;
    this.protocolId = data.protocolId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.user = data.user;
    this.experiment = data.experiment;
    this.protocol = data.protocol;
    this.messages = data.messages;
  }

  static create(input: CreateChatSessionInput): ChatSessionEntity {
    const now = new Date();
    return new ChatSessionEntity({
      id: crypto.randomUUID(),
      userId: input.userId,
      title: input.title?.trim() || "New Chat",
      experimentId: input.experimentId,
      protocolId: input.protocolId,
      createdAt: now,
      updatedAt: now,
    });
  }

  // --- Business logic ---

  updateTitle(title: string): void {
    const trimmed = title.trim();
    if (trimmed.length === 0) return;
    this.title = trimmed;
    this.updatedAt = new Date();
  }

  /**
   * Auto-generates a session title from the first user message.
   * Truncates to 60 characters with an ellipsis if needed.
   */
  generateTitleFromMessage(content: string): void {
    const trimmed = content.trim();
    this.title = trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
    this.updatedAt = new Date();
  }

  updateContext(input: UpdateChatSessionInput): void {
    if (input.title !== undefined) this.updateTitle(input.title);
    if (input.experimentId !== undefined) this.experimentId = input.experimentId ?? undefined;
    if (input.protocolId !== undefined) this.protocolId = input.protocolId ?? undefined;
    this.updatedAt = new Date();
  }

  /** Returns true when this session has at least one stored message. */
  hasMessages(): boolean {
    return (this.messages?.length ?? 0) > 0;
  }

  /** Returns the number of stored messages. */
  get messageCount(): number {
    return this.messages?.length ?? 0;
  }

  /** Returns the most recent message, or undefined if there are none. */
  get lastMessage(): ChatSessionMessage | undefined {
    if (!this.messages || this.messages.length === 0) return undefined;
    return this.messages[this.messages.length - 1];
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.userId) {
      errors.push("User ID is required");
    }

    if (!this.title || this.title.trim().length === 0) {
      errors.push("Session title cannot be empty");
    }

    if (this.title && this.title.length > 255) {
      errors.push("Session title must be less than 255 characters");
    }

    return { isValid: errors.length === 0, errors };
  }

  toJSON(): ChatSession {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      experimentId: this.experimentId,
      protocolId: this.protocolId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      user: this.user,
      experiment: this.experiment,
      protocol: this.protocol,
      messages: this.messages,
    };
  }
}
