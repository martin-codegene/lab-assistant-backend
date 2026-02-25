import { IAttachmentRepository } from "@domain/repositories";
import { Attachment, AttachmentType, UpdateAttachmentInput } from "@domain/attachment";
import { Pagination, PaginatedResult } from "@shared/types";
import { prisma } from "@infrastructure/database/prisma-client";

export class PrismaAttachmentRepository implements IAttachmentRepository {
  async findById(id: string): Promise<Attachment | null> {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        uploadedBy: true,
        experiment: {
          include: {
            protocol: true,
            createdBy: true,
          },
        },
      },
    });

    return attachment ? this.mapToDomain(attachment) : null;
  }

  async save(entity: Attachment): Promise<void> {
    await prisma.attachment.upsert({
      where: { id: entity.id },
      create: this.mapToPrisma(entity),
      update: {
        description: entity.description,
        thumbnailUrl: entity.thumbnailUrl,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.attachment.delete({
      where: { id },
    });
  }

  async findByExperiment(
    experimentId: string,
    pagination?: Pagination,
    filters?: { type?: AttachmentType },
  ): Promise<PaginatedResult<Attachment>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      experimentId,
      ...(filters?.type && { type: filters.type }),
    };

    const [attachments, total] = await Promise.all([
      prisma.attachment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: "desc" },
        include: {
          uploadedBy: true,
        },
      }),
      prisma.attachment.count({ where }),
    ]);

    return {
      data: attachments.map((a) => this.mapToDomain(a)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUser(
    userId: string,
    pagination?: Pagination,
    filters?: { type?: AttachmentType },
  ): Promise<PaginatedResult<Attachment>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      uploadedById: userId,
      ...(filters?.type && { type: filters.type }),
    };

    const [attachments, total] = await Promise.all([
      prisma.attachment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: "desc" },
        include: {
          uploadedBy: true,
          experiment: {
            include: {
              protocol: true,
              createdBy: true,
            },
          },
        },
      }),
      prisma.attachment.count({ where }),
    ]);

    return {
      data: attachments.map((a) => this.mapToDomain(a)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByType(
    type: AttachmentType,
    pagination?: Pagination,
  ): Promise<PaginatedResult<Attachment>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where = { type };

    const [attachments, total] = await Promise.all([
      prisma.attachment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: "desc" },
        include: {
          uploadedBy: true,
          experiment: {
            include: {
              protocol: true,
              createdBy: true,
            },
          },
        },
      }),
      prisma.attachment.count({ where }),
    ]);

    return {
      data: attachments.map((a) => this.mapToDomain(a)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteByExperiment(experimentId: string): Promise<void> {
    await prisma.attachment.deleteMany({
      where: { experimentId },
    });
  }

  // ---------------------------------------------------------------------------
  // Mappers
  // ---------------------------------------------------------------------------

  private mapToDomain(prismaAttachment: any): Attachment {
    return {
      id: prismaAttachment.id,
      experimentId: prismaAttachment.experimentId,
      type: prismaAttachment.type as AttachmentType,
      fileName: prismaAttachment.fileName,
      fileSize: prismaAttachment.fileSize,
      mimeType: prismaAttachment.mimeType,
      url: prismaAttachment.url,
      thumbnailUrl: prismaAttachment.thumbnailUrl ?? undefined,
      description: prismaAttachment.description ?? undefined,
      uploadedById: prismaAttachment.uploadedById,
      uploadedAt: prismaAttachment.uploadedAt,

      // Relations – only mapped when included in the query
      uploadedBy: prismaAttachment.uploadedBy
        ? {
            id: prismaAttachment.uploadedBy.id,
            email: prismaAttachment.uploadedBy.email,
            password: prismaAttachment.uploadedBy.password,
            name: prismaAttachment.uploadedBy.name ?? undefined,
            avatarUrl: prismaAttachment.uploadedBy.avatarUrl ?? undefined,
            role: prismaAttachment.uploadedBy.role,
            plan: prismaAttachment.uploadedBy.plan,
            createdAt: prismaAttachment.uploadedBy.createdAt,
            updatedAt: prismaAttachment.uploadedBy.updatedAt,
            lastLoginAt: prismaAttachment.uploadedBy.lastLoginAt ?? undefined,
          }
        : undefined,

      experiment: prismaAttachment.experiment
        ? {
            id: prismaAttachment.experiment.id,
            title: prismaAttachment.experiment.title,
            description: prismaAttachment.experiment.description ?? undefined,
            status: prismaAttachment.experiment.status,
            protocolId: prismaAttachment.experiment.protocolId,
            startDate: prismaAttachment.experiment.startDate ?? undefined,
            endDate: prismaAttachment.experiment.endDate ?? undefined,
            notes: prismaAttachment.experiment.notes ?? undefined,
            variables: prismaAttachment.experiment.variables as any,
            results: (prismaAttachment.experiment.results as any[]) ?? undefined,
            conclusion: prismaAttachment.experiment.conclusion ?? undefined,
            success: prismaAttachment.experiment.success ?? undefined,
            createdById: prismaAttachment.experiment.createdById,
            labId: prismaAttachment.experiment.labId ?? undefined,
            createdAt: prismaAttachment.experiment.createdAt,
            updatedAt: prismaAttachment.experiment.updatedAt,
          }
        : undefined,
    };
  }

  private mapToPrisma(attachment: Attachment): any {
    return {
      id: attachment.id,
      experimentId: attachment.experimentId,
      type: attachment.type,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      url: attachment.url,
      thumbnailUrl: attachment.thumbnailUrl,
      description: attachment.description,
      uploadedById: attachment.uploadedById,
      uploadedAt: attachment.uploadedAt,
    };
  }
}
