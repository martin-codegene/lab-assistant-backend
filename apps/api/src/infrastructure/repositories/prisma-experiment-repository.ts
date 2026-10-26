import { IExperimentRepository } from "@domain/repositories";
import { Experiment, ExperimentStatus } from "@domain/experiment";
import { Pagination, PaginatedResult } from "@shared/types";
import { prisma } from "@infrastructure/database/prisma-client";

export class PrismaExperimentRepository implements IExperimentRepository {
  async findById(id: string): Promise<Experiment | null> {
    const experiment = await prisma.experiment.findUnique({
      where: { id },
      include: {
        protocol: true,
        createdBy: true,
        lab: true,
      },
    });
    
    return experiment ? this.mapToDomain(experiment) : null;
  }

  async save(experiment: Experiment): Promise<void> {
    await prisma.experiment.upsert({
      where: { id: experiment.id },
      create: this.mapToPrisma(experiment),
      update: this.mapToPrisma(experiment),
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.experiment.delete({
      where: { id },
    });
  }

  async findByUser(userId: string, pagination?: Pagination, filters?: { status?: ExperimentStatus; protocolId?: string; labId?: string }): Promise<PaginatedResult<Experiment>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    
    const where = {
      createdById: userId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.protocolId && { protocolId: filters.protocolId }),
      ...(filters?.labId && { labId: filters.labId }),
    };
    
    const [experiments, total] = await Promise.all([
      prisma.experiment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          protocol: true,
          createdBy: true,
          lab: true,
        },
      }),
      prisma.experiment.count({ where }),
    ]);
    
    return {
      data: experiments.map(experiment => this.mapToDomain(experiment)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByProtocol(protocolId: string, pagination?: Pagination): Promise<PaginatedResult<Experiment>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    
    const [experiments, total] = await Promise.all([
      prisma.experiment.findMany({
        where: { protocolId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          protocol: true,
          createdBy: true,
          lab: true,
        },
      }),
      prisma.experiment.count({ where: { protocolId } }),
    ]);
    
    return {
      data: experiments.map(experiment => this.mapToDomain(experiment)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByLab(labId: string, pagination?: Pagination, filters?: { status?: ExperimentStatus }): Promise<PaginatedResult<Experiment>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    
    const where = {
      labId,
      ...(filters?.status && { status: filters.status }),
    };
    
    const [experiments, total] = await Promise.all([
      prisma.experiment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          protocol: true,
          createdBy: true,
          lab: true,
        },
      }),
      prisma.experiment.count({ where }),
    ]);
    
    return {
      data: experiments.map(experiment => this.mapToDomain(experiment)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findWithAnalyses(experimentId: string): Promise<Experiment | null> {
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        protocol: true,
        createdBy: true,
        lab: true,
        analyses: {
          include: {
            requestedBy: true,
          },
          orderBy: { requestedAt: 'desc' },
        },
      },
    });
    
    return experiment ? this.mapToDomain(experiment) : null;
  }

  async updateStatus(id: string, status: ExperimentStatus): Promise<Experiment> {
    const updatedExperiment = await prisma.experiment.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
        ...(status === ExperimentStatus.IN_PROGRESS && { startDate: new Date() }),
        ...((status === ExperimentStatus.COMPLETED || status === ExperimentStatus.FAILED || status === ExperimentStatus.CANCELLED) && { endDate: new Date() }),
      },
      include: {
        protocol: true,
        createdBy: true,
        lab: true,
      },
    });
    
    return this.mapToDomain(updatedExperiment);
  }

  async search(query: string, userId: string, pagination?: Pagination): Promise<PaginatedResult<Experiment>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    
    const where = {
      createdById: userId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } },
        { conclusion: { contains: query, mode: 'insensitive' } },
      ],
    };
    
    const [experiments, total] = await Promise.all([
      prisma.experiment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          protocol: true,
          createdBy: true,
          lab: true,
        },
      }),
      prisma.experiment.count({ where }),
    ]);
    
    return {
      data: experiments.map(experiment => this.mapToDomain(experiment)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private mapToDomain(prismaExperiment: any): Experiment {
    return {
      id: prismaExperiment.id,
      title: prismaExperiment.title,
      description: prismaExperiment.description || undefined,
      status: prismaExperiment.status,
      protocolId: prismaExperiment.protocolId,
      startDate: prismaExperiment.startDate || undefined,
      endDate: prismaExperiment.endDate || undefined,
      notes: prismaExperiment.notes || undefined,
      variables: prismaExperiment.variables as any,
      results: prismaExperiment.results as any[] | undefined,
      conclusion: prismaExperiment.conclusion || undefined,
      success: prismaExperiment.success || undefined,
      createdById: prismaExperiment.createdById,
      labId: prismaExperiment.labId || undefined,
      createdAt: prismaExperiment.createdAt,
      updatedAt: prismaExperiment.updatedAt,
      protocol: prismaExperiment.protocol ? {
        id: prismaExperiment.protocol.id,
        name: prismaExperiment.protocol.name,
        description: prismaExperiment.protocol.description || undefined,
        category: prismaExperiment.protocol.category,
        version: prismaExperiment.protocol.version,
        isPublic: prismaExperiment.protocol.isPublic,
        isTemplate: prismaExperiment.protocol.isTemplate,
        materials: prismaExperiment.protocol.materials as any[],
        steps: prismaExperiment.protocol.steps as any[],
        conditions: prismaExperiment.protocol.conditions as any,
        safetyNotes: prismaExperiment.protocol.safetyNotes || undefined,
        references: prismaExperiment.protocol.references || undefined,
        createdById: prismaExperiment.protocol.createdById,
        createdAt: prismaExperiment.protocol.createdAt,
        updatedAt: prismaExperiment.protocol.updatedAt,
        lastUsedAt: prismaExperiment.protocol.lastUsedAt || undefined,
        usageCount: prismaExperiment.protocol.usageCount,
      } : undefined,
      createdBy: prismaExperiment.createdBy ? {
        id: prismaExperiment.createdBy.id,
        email: prismaExperiment.createdBy.email,
        name: prismaExperiment.createdBy.name || undefined,
        avatarUrl: prismaExperiment.createdBy.avatarUrl || undefined,
        role: prismaExperiment.createdBy.role,
        plan: prismaExperiment.createdBy.plan,
        createdAt: prismaExperiment.createdBy.createdAt,
        updatedAt: prismaExperiment.createdBy.updatedAt,
        lastLoginAt: prismaExperiment.createdBy.lastLoginAt || undefined,
      } : undefined,
      lab: prismaExperiment.lab ? {
        id: prismaExperiment.lab.id,
        name: prismaExperiment.lab.name,
        description: prismaExperiment.lab.description || undefined,
        location: prismaExperiment.lab.location || undefined,
        contactEmail: prismaExperiment.lab.contactEmail || undefined,
        settings: prismaExperiment.lab.settings as any,
        createdById: prismaExperiment.lab.createdById,
        createdAt: prismaExperiment.lab.createdAt,
        updatedAt: prismaExperiment.lab.updatedAt,
      } : undefined,
    };
  }

  private mapToPrisma(experiment: Experiment): any {
    return {
      id: experiment.id,
      title: experiment.title,
      description: experiment.description,
      status: experiment.status,
      protocolId: experiment.protocolId,
      startDate: experiment.startDate,
      endDate: experiment.endDate,
      notes: experiment.notes,
      variables: experiment.variables,
      results: experiment.results,
      conclusion: experiment.conclusion,
      success: experiment.success,
      createdById: experiment.createdById,
      labId: experiment.labId,
      createdAt: experiment.createdAt,
      updatedAt: experiment.updatedAt,
    };
  }
}