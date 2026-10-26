import { IAnalysisRepository } from "@domain/repositories";
import { Analysis, AnalysisType } from "@domain/analysis";
import { Pagination, PaginatedResult } from "@shared/types";
import { prisma } from "@infrastructure/database/prisma-client";

export class PrismaAnalysisRepository implements IAnalysisRepository {
  async findById(id: string): Promise<Analysis | null> {
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        experiment: true,
        requestedBy: true,
      },
    });
    
    return analysis ? this.mapToDomain(analysis) : null;
  }

  async save(analysis: Analysis): Promise<void> {
    const {  updatedAt, ...data} = analysis;
    await prisma.analysis.upsert({
      where: { id: analysis.id },
      create: this.mapToPrisma(data),
      update: this.mapToPrisma(data),
      include: {
        experiment: true,
        requestedBy: true,
      },
    }, );
  }

  async delete(id: string): Promise<void> {
    await prisma.analysis.delete({
      where: { id },
    });
  }

  async findByExperiment(experimentId: string, pagination?: Pagination): Promise<PaginatedResult<Analysis>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    
    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where: { experimentId },
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          experiment: true,
          requestedBy: true,
        },
      }),
      prisma.analysis.count({ where: { experimentId } }),
    ]);
    
    return {
      data: analyses.map(analysis => this.mapToDomain(analysis)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByType(type: AnalysisType, pagination?: Pagination): Promise<PaginatedResult<Analysis>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    
    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where: { type },
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          experiment: true,
          requestedBy: true,
        },
      }),
      prisma.analysis.count({ where: { type } }),
    ]);
    
    return {
      data: analyses.map(analysis => this.mapToDomain(analysis)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUser(userId: string, pagination?: Pagination): Promise<PaginatedResult<Analysis>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    
    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where: { requestedById: userId },
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          experiment: true,
          requestedBy: true,
        },
      }),
      prisma.analysis.count({ where: { requestedById: userId } }),
    ]);
    
    return {
      data: analyses.map(analysis => this.mapToDomain(analysis)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findRecent(pagination?: Pagination): Promise<PaginatedResult<Analysis>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    
    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          experiment: true,
          requestedBy: true,
        },
      }),
      prisma.analysis.count(),
    ]);
    
    return {
      data: analyses.map(analysis => this.mapToDomain(analysis)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateResults(id: string, observations: any[], recommendations: any[], nextSteps: any[], confidence?: number): Promise<Analysis> {
    const updatedAnalysis = await prisma.analysis.update({
      where: { id },
      data: {
        observations,
        recommendations,
        nextSteps,
        confidence,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        experiment: true,
        requestedBy: true,
      },
    });
    
    return this.mapToDomain(updatedAnalysis);
  }

  private mapToDomain(prismaAnalysis: any): Analysis {
    return {
      id: prismaAnalysis.id,
      experimentId: prismaAnalysis.experimentId,
      type: prismaAnalysis.type,
      inputData: prismaAnalysis.inputData as any,
      modelUsed: prismaAnalysis.modelUsed,
      observations: prismaAnalysis.observations as any[],
      confidence: prismaAnalysis.confidence || undefined,
      recommendations: prismaAnalysis.recommendations as any[],
      nextSteps: prismaAnalysis.nextSteps as any[],
      requestedById: prismaAnalysis.requestedById,
      createdAt: prismaAnalysis.requestedAt,
      updatedAt: prismaAnalysis.updatedAt || prismaAnalysis.requestedAt,
      completedAt: prismaAnalysis.completedAt || undefined,
      processingTime: prismaAnalysis.processingTime || undefined,
      experiment: prismaAnalysis.experiment ? {
        id: prismaAnalysis.experiment.id,
        title: prismaAnalysis.experiment.title,
        description: prismaAnalysis.experiment.description || undefined,
        status: prismaAnalysis.experiment.status,
        protocolId: prismaAnalysis.experiment.protocolId,
        startDate: prismaAnalysis.experiment.startDate || undefined,
        endDate: prismaAnalysis.experiment.endDate || undefined,
        notes: prismaAnalysis.experiment.notes || undefined,
        variables: prismaAnalysis.experiment.variables as any,
        results: prismaAnalysis.experiment.results as any[] | undefined,
        conclusion: prismaAnalysis.experiment.conclusion || undefined,
        success: prismaAnalysis.experiment.success || undefined,
        createdById: prismaAnalysis.experiment.createdById,
        labId: prismaAnalysis.experiment.labId || undefined,
        createdAt: prismaAnalysis.experiment.createdAt,
        updatedAt: prismaAnalysis.experiment.updatedAt,
      } : undefined,
      requestedBy: prismaAnalysis.requestedBy ? {
        id: prismaAnalysis.requestedBy.id,
        email: prismaAnalysis.requestedBy.email,
        name: prismaAnalysis.requestedBy.name || undefined,
        avatarUrl: prismaAnalysis.requestedBy.avatarUrl || undefined,
        role: prismaAnalysis.requestedBy.role,
        plan: prismaAnalysis.requestedBy.plan,
        createdAt: prismaAnalysis.requestedBy.createdAt,
        updatedAt: prismaAnalysis.requestedBy.updatedAt,
        lastLoginAt: prismaAnalysis.requestedBy.lastLoginAt || undefined,
      } : undefined,
    };
  }

  private mapToPrisma(analysis: Analysis): any {
    return {
      id: analysis.id,
      experimentId: analysis.experimentId,
      type: analysis.type,
      inputData: analysis.inputData,
      modelUsed: analysis.modelUsed,
      observations: analysis.observations,
      confidence: analysis.confidence,
      recommendations: analysis.recommendations,
      nextSteps: analysis.nextSteps,
      requestedById: analysis.requestedById,
      requestedAt: analysis.createdAt,
      completedAt: analysis.completedAt,
      processingTime: analysis.processingTime,
      updatedAt: analysis.updatedAt,
    };
  }
}