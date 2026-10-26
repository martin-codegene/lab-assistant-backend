import { IUploadRepository } from "@domain/repositories";
import { Upload } from "@domain/upload";
import { Pagination, PaginatedResult } from "@shared/types";
import { prisma } from "@infrastructure/database/prisma-client";

export class PrismaUploadRepository implements IUploadRepository {
  async findById(id: string): Promise<Upload | null> {
    const upload = await prisma.uploads.findUnique({
      where: { id },
      include: { uploader: true },
    });

    return upload ? this.mapToDomain(upload) : null;
  }

  async findByKey(key: string): Promise<Upload | null> {
    const upload = await prisma.uploads.findUnique({
      where: { key },
      include: { uploader: true },
    });

    return upload ? this.mapToDomain(upload) : null;
  }

  async save(entity: Upload): Promise<void> {
    await prisma.uploads.upsert({
      where: { id: entity.id },
      create: this.mapToPrisma(entity),
      update: {
        url: entity.url,
        isPublic: entity.isPublic,
        updatedAt: entity.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.uploads.delete({ where: { id } });
  }

  async findByUploader(
    uploaderId: string,
    pagination?: Pagination,
  ): Promise<PaginatedResult<Upload>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where = { uploaderId };

    const [uploads, total] = await Promise.all([
      prisma.uploads.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { uploader: true },
      }),
      prisma.uploads.count({ where }),
    ]);

    return {
      data: uploads.map((u) => this.mapToDomain(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublic(pagination?: Pagination): Promise<PaginatedResult<Upload>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where = { isPublic: true };

    const [uploads, total] = await Promise.all([
      prisma.uploads.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { uploader: true },
      }),
      prisma.uploads.count({ where }),
    ]);

    return {
      data: uploads.map((u) => this.mapToDomain(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ---------------------------------------------------------------------------
  // Mappers
  // ---------------------------------------------------------------------------

  private mapToDomain(prismaUpload: any): Upload {
    return {
      id: prismaUpload.id,
      name: prismaUpload.name,
      url: prismaUpload.url,
      key: prismaUpload.key,
      type: prismaUpload.type,
      size: prismaUpload.size,
      uploaderId: prismaUpload.uploaderId,
      isPublic: prismaUpload.isPublic,
      createdAt: prismaUpload.createdAt,
      updatedAt: prismaUpload.updatedAt,
      uploader: prismaUpload.uploader
        ? {
            id: prismaUpload.uploader.id,
            email: prismaUpload.uploader.email,
            password: prismaUpload.uploader.password,
            name: prismaUpload.uploader.name ?? undefined,
            avatarUrl: prismaUpload.uploader.avatarUrl ?? undefined,
            role: prismaUpload.uploader.role,
            plan: prismaUpload.uploader.plan,
            createdAt: prismaUpload.uploader.createdAt,
            updatedAt: prismaUpload.uploader.updatedAt,
            lastLoginAt: prismaUpload.uploader.lastLoginAt ?? undefined,
          }
        : undefined,
    };
  }

  private mapToPrisma(upload: Upload): any {
    return {
      id: upload.id,
      name: upload.name,
      url: upload.url,
      key: upload.key,
      type: upload.type,
      size: upload.size,
      uploaderId: upload.uploaderId,
      isPublic: upload.isPublic,
      createdAt: upload.createdAt,
      updatedAt: upload.updatedAt,
    };
  }
}
