import { IAnalysisRepository, IExperimentRepository } from "@domain/repositories";
import {
  Analysis,
  AnalysisEntity,
  CreateAnalysisInput,
  UpdateAnalysisInput,
  AnalysisType,
  AnalysisObservation,
  AnalysisRecommendation,
  AnalysisNextStep,
} from "@domain/analysis";
import { Pagination, PaginatedResult, Result } from "@shared/types";
import { IAIService } from "@infrastructure/services/ai-service.interface";

export class AnalysisUseCases {
  constructor(
    private analysisRepository: IAnalysisRepository,
    private experimentRepository: IExperimentRepository,
    private aiService: IAIService
  ) {}

  async createAnalysis(input: CreateAnalysisInput): Promise<Result<Analysis>> {
    try {
      // Verify experiment exists
      const experiment = await this.experimentRepository.findById(input.experimentId);
      if (!experiment) {
        return {
          success: false,
          error: "Experiment not found",
        };
      }

      // Create analysis entity
      const analysis = AnalysisEntity.create(input);

      // Validate
      const validation = analysis.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      // Save to repository
      await this.analysisRepository.save(analysis);

      return {
        success: true,
        data: analysis.toJSON(),
        message: "Analysis created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create analysis",
      };
    }
  }

  async getAnalysisById(id: string): Promise<Result<Analysis>> {
    try {
      const analysis = await this.analysisRepository.findById(id);

      if (!analysis) {
        return {
          success: false,
          error: "Analysis not found",
        };
      }

      return {
        success: true,
        data: analysis,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get analysis",
      };
    }
  }

  async updateAnalysis(id: string, input: UpdateAnalysisInput): Promise<Result<Analysis>> {
    try {
      const existing = await this.analysisRepository.findById(id);

      if (!existing) {
        return {
          success: false,
          error: "Analysis not found",
        };
      }

      const analysis = new AnalysisEntity(existing);
      analysis.update(input);

      // Validate
      const validation = analysis.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      await this.analysisRepository.save(analysis);

      return {
        success: true,
        data: analysis.toJSON(),
        message: "Analysis updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update analysis",
      };
    }
  }

  async deleteAnalysis(id: string): Promise<Result<void>> {
    try {
      const analysis = await this.analysisRepository.findById(id);

      if (!analysis) {
        return {
          success: false,
          error: "Analysis not found",
        };
      }

      await this.analysisRepository.delete(id);

      return {
        success: true,
        message: "Analysis deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete analysis",
      };
    }
  }

  async listExperimentAnalyses(
    experimentId: string,
    pagination?: Pagination
  ): Promise<Result<PaginatedResult<Analysis>>> {
    try {
      // Verify experiment exists
      const experiment = await this.experimentRepository.findById(experimentId);
      if (!experiment) {
        return {
          success: false,
          error: "Experiment not found",
        };
      }

      const result = await this.analysisRepository.findByExperiment(experimentId, pagination);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list experiment analyses",
      };
    }
  }

  async listUserAnalyses(
    userId: string,
    pagination?: Pagination
  ): Promise<Result<PaginatedResult<Analysis>>> {
    try {
      const result = await this.analysisRepository.findByUser(userId, pagination);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list user analyses",
      };
    }
  }

  async listAnalysesByType(
    type: AnalysisType,
    pagination?: Pagination
  ): Promise<Result<PaginatedResult<Analysis>>> {
    try {
      const result = await this.analysisRepository.findByType(type, pagination);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list analyses by type",
      };
    }
  }

  async listRecentAnalyses(pagination?: Pagination): Promise<Result<PaginatedResult<Analysis>>> {
    try {
      const result = await this.analysisRepository.findRecent(pagination);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list recent analyses",
      };
    }
  }

  async completeAnalysis(
    id: string,
    observations: AnalysisObservation[],
    recommendations: AnalysisRecommendation[],
    nextSteps: AnalysisNextStep[],
    confidence?: number,
    processingTime?: number
  ): Promise<Result<Analysis>> {
    try {
      const existing = await this.analysisRepository.findById(id);

      if (!existing) {
        return {
          success: false,
          error: "Analysis not found",
        };
      }

      const analysis = new AnalysisEntity(existing);
      analysis.complete(observations, recommendations, nextSteps, confidence);
      
      if (processingTime !== undefined) {
        analysis.processingTime = processingTime;
      }

      // Validate
      const validation = analysis.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      await this.analysisRepository.save(analysis);

      return {
        success: true,
        data: analysis.toJSON(),
        message: "Analysis completed successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to complete analysis",
      };
    }
  }

  // AI Service Integration Methods
  async requestGelImageAnalysis(
    experimentId: string,
    userId: string,
    imageUrl: string,
    metadata?: Record<string, any>
  ): Promise<Result<Analysis>> {
    try {
      const startTime = Date.now();

      // Create analysis request
      const analysisResult = await this.createAnalysis({
        experimentId,
        type: AnalysisType.GEL_IMAGE,
        inputData: {
          imageUrl,
          metadata: metadata || {},
        },
        modelUsed: this.aiService.getServiceName(),
        requestedById: userId,
      });

      if (!analysisResult.success || !('data' in analysisResult)) {
        return analysisResult as Result<Analysis>;
      }

      const analysisId = analysisResult.data.id;

      // Call AI service for actual analysis
      const aiResult = await this.aiService.analyzeImage({
        imageUrl,
        analysisType: AnalysisType.GEL_IMAGE,
        metadata,
      });

      // Complete the analysis with AI results
      return await this.completeAnalysis(
        analysisId,
        aiResult.observations,
        aiResult.recommendations,
        aiResult.nextSteps,
        aiResult.confidence,
        aiResult.processingTime
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze gel image",
      };
    }
  }

  async requestTroubleshootingAnalysis(
    experimentId: string,
    userId: string,
    problem: string,
    context?: Record<string, any>
  ): Promise<Result<Analysis>> {
    try {
      const startTime = Date.now();

      // Create analysis request
      const analysisResult = await this.createAnalysis({
        experimentId,
        type: AnalysisType.TROUBLESHOOTING,
        inputData: {
          problem,
          context: context || {},
        },
        modelUsed: this.aiService.getServiceName(),
        requestedById: userId,
      });

      if (!analysisResult.success || !('data' in analysisResult)) {
        return analysisResult as Result<Analysis>;
      }

      const analysisId = analysisResult.data.id;

      // Call AI service for actual analysis
      const aiResult = await this.aiService.analyzeText({
        prompt: problem,
        context,
        analysisType: AnalysisType.TROUBLESHOOTING,
      });

      return await this.completeAnalysis(
        analysisId,
        aiResult.observations,
        aiResult.recommendations,
        aiResult.nextSteps,
        aiResult.confidence,
        aiResult.processingTime
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze troubleshooting request",
      };
    }
  }

  async requestProtocolOptimization(
    experimentId: string,
    userId: string,
    currentProtocol: Record<string, any>,
    issues?: string[]
  ): Promise<Result<Analysis>> {
    try {
      const startTime = Date.now();

      const analysisResult = await this.createAnalysis({
        experimentId,
        type: AnalysisType.PROTOCOL_OPTIMIZATION,
        inputData: {
          currentProtocol,
          issues: issues || [],
        },
        modelUsed: this.aiService.getServiceName(),
        requestedById: userId,
      });

      if (!analysisResult.success || !('data' in analysisResult)) {
        return analysisResult as Result<Analysis>;
      }

      const analysisId = analysisResult.data.id;

      // Call AI service for actual analysis
      const prompt = `Optimize the following protocol:\n${JSON.stringify(currentProtocol, null, 2)}\n\nIssues to address: ${issues?.join(", ") || "None specified"}`;
      
      const aiResult = await this.aiService.analyzeText({
        prompt,
        context: { currentProtocol, issues },
        analysisType: AnalysisType.PROTOCOL_OPTIMIZATION,
      });

      return await this.completeAnalysis(
        analysisId,
        aiResult.observations,
        aiResult.recommendations,
        aiResult.nextSteps,
        aiResult.confidence,
        aiResult.processingTime
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to optimize protocol",
      };
    }
  }
}
