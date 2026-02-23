import { IProtocolRepository } from "@domain/repositories";
import { Protocol, ProtocolCategory } from "@domain/protocol";
import { Pagination, PaginatedResult } from "@shared/types";
import { prisma } from "@infrastructure/database/prisma-client";
import { Prisma } from "@prisma/client";

export class PrismaProtocolRepository implements IProtocolRepository {
  async findById(id: string): Promise<Protocol | null> {
    const protocol = await prisma.protocol.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            plan: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!protocol) return null;

    return this.mapToProtocol(protocol);
  }

  async save(entity: Protocol): Promise<void> {
    await prisma.protocol.create({
      data: {
        id: entity.id,
        name: entity.name,
        description: entity.description,
        category: entity.category,
        version: entity.version,
        isPublic: entity.isPublic,
        isTemplate: entity.isTemplate,
        materials: entity.materials as unknown as Prisma.InputJsonValue,
        steps: entity.steps as unknown as Prisma.InputJsonValue,
        conditions: entity.conditions as unknown as Prisma.InputJsonValue,
        safetyNotes: entity.safetyNotes,
        references: entity.references,
        createdById: entity.createdById,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        lastUsedAt: entity.lastUsedAt,
        usageCount: entity.usageCount,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.protocol.delete({
      where: { id },
    });
  }

  async findByUser(
    userId: string,
    pagination?: Pagination,
    filters?: { category?: ProtocolCategory; isPublic?: boolean; isTemplate?: boolean }
  ): Promise<PaginatedResult<Protocol>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProtocolWhereInput = {
      createdById: userId,
      ...(filters?.category && { category: filters.category }),
      ...(filters?.isPublic !== undefined && { isPublic: filters.isPublic }),
      ...(filters?.isTemplate !== undefined && { isTemplate: filters.isTemplate }),
    };

    const [protocols, total] = await Promise.all([
      prisma.protocol.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              plan: true,
              avatarUrl: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.protocol.count({ where }),
    ]);

    return {
      data: protocols.map(this.mapToProtocol),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByCategory(
    category: ProtocolCategory,
    pagination?: Pagination
  ): Promise<PaginatedResult<Protocol>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProtocolWhereInput = {
      category,
      isPublic: true,
    };

    const [protocols, total] = await Promise.all([
      prisma.protocol.findMany({
        where,
        skip,
        take: limit,
        orderBy: { usageCount: "desc" },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              plan: true,
              avatarUrl: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.protocol.count({ where }),
    ]);

    return {
      data: protocols.map(this.mapToProtocol),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublicProtocols(
    pagination?: Pagination,
    search?: string
  ): Promise<PaginatedResult<Protocol>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProtocolWhereInput = {
      isPublic: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [protocols, total] = await Promise.all([
      prisma.protocol.findMany({
        where,
        skip,
        take: limit,
        orderBy: { usageCount: "desc" },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              plan: true,
              avatarUrl: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.protocol.count({ where }),
    ]);

    return {
      data: protocols.map(this.mapToProtocol),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTemplates(pagination?: Pagination): Promise<PaginatedResult<Protocol>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProtocolWhereInput = {
      isTemplate: true,
      isPublic: true,
    };

    const [protocols, total] = await Promise.all([
      prisma.protocol.findMany({
        where,
        skip,
        take: limit,
        orderBy: { usageCount: "desc" },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              plan: true,
              avatarUrl: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.protocol.count({ where }),
    ]);

    return {
      data: protocols.map(this.mapToProtocol),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async incrementUsageCount(id: string): Promise<void> {
    await prisma.protocol.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  }

  async search(query: string, pagination?: Pagination): Promise<PaginatedResult<Protocol>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProtocolWhereInput = {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    };

    const [protocols, total] = await Promise.all([
      prisma.protocol.findMany({
        where,
        skip,
        take: limit,
        orderBy: { usageCount: "desc" },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              plan: true,
              avatarUrl: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.protocol.count({ where }),
    ]);

    return {
      data: protocols.map(this.mapToProtocol),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private mapToProtocol(prismaProtocol: any): Protocol {
    return {
      id: prismaProtocol.id,
      name: prismaProtocol.name,
      description: prismaProtocol.description,
      category: prismaProtocol.category as ProtocolCategory,
      version: prismaProtocol.version,
      isPublic: prismaProtocol.isPublic,
      isTemplate: prismaProtocol.isTemplate,
      materials: prismaProtocol.materials as any,
      steps: prismaProtocol.steps as any,
      conditions: prismaProtocol.conditions as any,
      safetyNotes: prismaProtocol.safetyNotes,
      references: prismaProtocol.references,
      createdById: prismaProtocol.createdById,
      createdAt: prismaProtocol.createdAt,
      updatedAt: prismaProtocol.updatedAt,
      lastUsedAt: prismaProtocol.lastUsedAt,
      usageCount: prismaProtocol.usageCount,
      createdBy: prismaProtocol.createdBy
        ? {
            id: prismaProtocol.createdBy.id,
            email: prismaProtocol.createdBy.email,
            name: prismaProtocol.createdBy.name,
            role: prismaProtocol.createdBy.role,
            plan: prismaProtocol.createdBy.plan,
            avatarUrl: prismaProtocol.createdBy.avatarUrl,
            createdAt: prismaProtocol.createdBy.createdAt,
            updatedAt: prismaProtocol.createdBy.updatedAt,
          }
        : undefined,
    };
  }
}
