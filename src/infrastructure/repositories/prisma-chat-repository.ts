import { IChatSessionRepository } from "@domain/repositories";
import {
  ChatSession,
  ChatSessionMessage,
  ChatMessageRole,
  CreateChatMessageInput,
} from "@domain/chat";
import { Pagination, PaginatedResult } from "@shared/types";
import { prisma } from "@infrastructure/database/prisma-client";

export class PrismaChatRepository implements IChatSessionRepository {
  // ─── Session operations ────────────────────────────────────────────────────

  async findById(id: string): Promise<ChatSession | null> {
    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: {
        user: true,
        experiment: true,
        protocol: true,
      },
    });

    return session ? this.mapSessionToDomain(session) : null;
  }

  async findWithMessages(id: string): Promise<ChatSession | null> {
    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: {
        user: true,
        experiment: true,
        protocol: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return session ? this.mapSessionToDomain(session) : null;
  }

  async save(session: ChatSession): Promise<void> {
    await prisma.chatSession.upsert({
      where: { id: session.id },
      create: {
        id: session.id,
        userId: session.userId,
        title: session.title,
        experimentId: session.experimentId ?? null,
        protocolId: session.protocolId ?? null,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      update: {
        title: session.title,
        experimentId: session.experimentId ?? null,
        protocolId: session.protocolId ?? null,
        updatedAt: session.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    // Messages are deleted by the onDelete: Cascade on ChatSessionMessage
    await prisma.chatSession.delete({ where: { id } });
  }

  async findByUser(
    userId: string,
    pagination?: Pagination,
  ): Promise<PaginatedResult<ChatSession>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where = { userId };

    const [sessions, total] = await Promise.all([
      prisma.chatSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          user: true,
          experiment: true,
          protocol: true,
          // include only last message for list preview
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.chatSession.count({ where }),
    ]);

    return {
      data: sessions.map((s) => this.mapSessionToDomain(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Message operations ────────────────────────────────────────────────────

  async addMessage(input: CreateChatMessageInput): Promise<ChatSessionMessage> {
    const message = await prisma.chatSessionMessage.create({
      data: {
        id: crypto.randomUUID(),
        sessionId: input.sessionId,
        role: input.role,
        content: input.content,
        createdAt: new Date(),
      },
    });

    // Bump the session's updatedAt so it floats to the top of the list
    await prisma.chatSession.update({
      where: { id: input.sessionId },
      data: { updatedAt: new Date() },
    });

    return this.mapMessageToDomain(message);
  }

  async getMessages(
    sessionId: string,
    pagination?: Pagination,
  ): Promise<PaginatedResult<ChatSessionMessage>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const where = { sessionId };

    const [messages, total] = await Promise.all([
      prisma.chatSessionMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
      }),
      prisma.chatSessionMessage.count({ where }),
    ]);

    return {
      data: messages.map((m) => this.mapMessageToDomain(m)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllMessages(sessionId: string): Promise<ChatSessionMessage[]> {
    const messages = await prisma.chatSessionMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    return messages.map((m) => this.mapMessageToDomain(m));
  }

  async deleteMessages(sessionId: string): Promise<void> {
    await prisma.chatSessionMessage.deleteMany({ where: { sessionId } });
  }

  // ─── Mappers ───────────────────────────────────────────────────────────────

  private mapSessionToDomain(prismaSession: any): ChatSession {
    return {
      id: prismaSession.id,
      userId: prismaSession.userId,
      title: prismaSession.title,
      experimentId: prismaSession.experimentId ?? undefined,
      protocolId: prismaSession.protocolId ?? undefined,
      createdAt: prismaSession.createdAt,
      updatedAt: prismaSession.updatedAt,

      user: prismaSession.user
        ? {
            id: prismaSession.user.id,
            email: prismaSession.user.email,
            password: prismaSession.user.password,
            name: prismaSession.user.name ?? undefined,
            avatarUrl: prismaSession.user.avatarUrl ?? undefined,
            role: prismaSession.user.role,
            plan: prismaSession.user.plan,
            createdAt: prismaSession.user.createdAt,
            updatedAt: prismaSession.user.updatedAt,
            lastLoginAt: prismaSession.user.lastLoginAt ?? undefined,
          }
        : undefined,

      experiment: prismaSession.experiment
        ? {
            id: prismaSession.experiment.id,
            title: prismaSession.experiment.title,
            description: prismaSession.experiment.description ?? undefined,
            status: prismaSession.experiment.status,
            protocolId: prismaSession.experiment.protocolId,
            startDate: prismaSession.experiment.startDate ?? undefined,
            endDate: prismaSession.experiment.endDate ?? undefined,
            notes: prismaSession.experiment.notes ?? undefined,
            variables: prismaSession.experiment.variables as any,
            results: (prismaSession.experiment.results as any[]) ?? undefined,
            conclusion: prismaSession.experiment.conclusion ?? undefined,
            success: prismaSession.experiment.success ?? undefined,
            createdById: prismaSession.experiment.createdById,
            labId: prismaSession.experiment.labId ?? undefined,
            createdAt: prismaSession.experiment.createdAt,
            updatedAt: prismaSession.experiment.updatedAt,
          }
        : undefined,

      protocol: prismaSession.protocol
        ? {
            id: prismaSession.protocol.id,
            name: prismaSession.protocol.name,
            description: prismaSession.protocol.description ?? undefined,
            category: prismaSession.protocol.category,
            version: prismaSession.protocol.version,
            isPublic: prismaSession.protocol.isPublic,
            isTemplate: prismaSession.protocol.isTemplate,
            materials: prismaSession.protocol.materials as any[],
            steps: prismaSession.protocol.steps as any[],
            conditions: prismaSession.protocol.conditions as any,
            safetyNotes: prismaSession.protocol.safetyNotes ?? undefined,
            references: prismaSession.protocol.references ?? undefined,
            createdById: prismaSession.protocol.createdById,
            createdAt: prismaSession.protocol.createdAt,
            updatedAt: prismaSession.protocol.updatedAt,
            lastUsedAt: prismaSession.protocol.lastUsedAt ?? undefined,
            usageCount: prismaSession.protocol.usageCount,
          }
        : undefined,

      messages: prismaSession.messages
        ? prismaSession.messages.map((m: any) => this.mapMessageToDomain(m))
        : undefined,
    };
  }

  private mapMessageToDomain(prismaMessage: any): ChatSessionMessage {
    return {
      id: prismaMessage.id,
      sessionId: prismaMessage.sessionId,
      role: prismaMessage.role as ChatMessageRole,
      content: prismaMessage.content,
      createdAt: prismaMessage.createdAt,
    };
  }
}
