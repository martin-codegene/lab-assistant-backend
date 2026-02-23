import { Pagination, PaginatedResult, ApiResponse } from "@shared/types";
import { IExperimentRepository, IProtocolRepository } from "@domain/repositories";
import { ExperimentEntity, CreateExperimentInput, UpdateExperimentInput, ExperimentStatus } from "@domain/experiment";
import { ProtocolEntity } from "@domain/protocol";

export class ExperimentUseCases {
  constructor(
    private experimentRepository: IExperimentRepository,
    private protocolRepository: IProtocolRepository
  ) {}

  async createExperiment(input: CreateExperimentInput): Promise<ApiResponse<ExperimentEntity>> {
    try {
      // Check if protocol exists
      const protocol = await this.protocolRepository.findById(input.protocolId);
      if (!protocol) {
        return {
          success: false,
          error: "Protocol not found",
        };
      }

      // Create experiment entity
      const experiment = ExperimentEntity.create(input);
      
      // Validate
      const validation = experiment.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      // Save to repository
      await this.experimentRepository.save(experiment);

      // Record protocol usage
      await this.protocolRepository.incrementUsageCount(input.protocolId);

      return {
        success: true,
        data: experiment,
        message: "Experiment created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create experiment",
      };
    }
  }

  async getExperimentById(id: string): Promise<ApiResponse<ExperimentEntity>> {
    try {
      const experiment = await this.experimentRepository.findById(id);
      if (!experiment) {
        return {
          success: false,
          error: "Experiment not found",
        };
      }

      return {
        success: true,
        data: new ExperimentEntity(experiment),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get experiment",
      };
    }
  }

  async getExperimentWithAnalyses(id: string): Promise<ApiResponse<ExperimentEntity>> {
    try {
      const experiment = await this.experimentRepository.findWithAnalyses(id);
      if (!experiment) {
        return {
          success: false,
          error: "Experiment not found",
        };
      }

      return {
        success: true,
        data: new ExperimentEntity(experiment),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get experiment with analyses",
      };
    }
  }

  async updateExperiment(id: string, input: UpdateExperimentInput): Promise<ApiResponse<ExperimentEntity>> {
    try {
      const experiment = await this.experimentRepository.findById(id);
      if (!experiment) {
        return {
          success: false,
          error: "Experiment not found",
        };
      }

      const experimentEntity = new ExperimentEntity(experiment);
      experimentEntity.update(input);

      // Validate
      const validation = experimentEntity.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      // Save updated experiment
      await this.experimentRepository.save(experimentEntity);

      return {
        success: true,
        data: experimentEntity,
        message: "Experiment updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update experiment",
      };
    }
  }

  async deleteExperiment(id: string): Promise<ApiResponse<void>> {
    try {
      const experiment = await this.experimentRepository.findById(id);
      if (!experiment) {
        return {
          success: false,
          error: "Experiment not found",
        };
      }

      await this.experimentRepository.delete(id);

      return {
        success: true,
        message: "Experiment deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete experiment",
      };
    }
  }

  async listUserExperiments(userId: string, pagination?: Pagination, filters?: { status?: ExperimentStatus; protocolId?: string; labId?: string }): Promise<ApiResponse<PaginatedResult<ExperimentEntity>>> {
    try {
      const result = await this.experimentRepository.findByUser(userId, pagination, filters);

      const experimentEntities = result.data.map(experiment => new ExperimentEntity(experiment));

      return {
        success: true,
        data: {
          ...result,
          data: experimentEntities,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list user experiments",
      };
    }
  }

  async listProtocolExperiments(protocolId: string, pagination?: Pagination): Promise<ApiResponse<PaginatedResult<ExperimentEntity>>> {
    try {
      const result = await this.experimentRepository.findByProtocol(protocolId, pagination);

      const experimentEntities = result.data.map(experiment => new ExperimentEntity(experiment));

      return {
        success: true,
        data: {
          ...result,
          data: experimentEntities,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list protocol experiments",
      };
    }
  }

  async listLabExperiments(labId: string, pagination?: Pagination, filters?: { status?: ExperimentStatus }): Promise<ApiResponse<PaginatedResult<ExperimentEntity>>> {
    try {
      const result = await this.experimentRepository.findByLab(labId, pagination, filters);

      const experimentEntities = result.data.map(experiment => new ExperimentEntity(experiment));

      return {
        success: true,
        data: {
          ...result,
          data: experimentEntities,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list lab experiments",
      };
    }
  }

  async startExperiment(id: string): Promise<ApiResponse<ExperimentEntity>> {
    try {
      const experiment = await this.experimentRepository.findById(id);
      if (!experiment) {
        return {
          success: false,
          error: "Experiment not found",
        };
      }

      const experimentEntity = new ExperimentEntity(experiment);
      experimentEntity.start();

      // Update status in repository
      await this.experimentRepository.updateStatus(id, ExperimentStatus.IN_PROGRESS);

      return {
        success: true,
        data: experimentEntity,
        message: "Experiment started successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start experiment",
      };
    }
  }

  async completeExperiment(id: string, success: boolean, conclusion?: string): Promise<ApiResponse<ExperimentEntity>> {
    try {
      const experiment = await this.experimentRepository.findById(id);
      if (!experiment) {
        return {
          success: false,
          error: "Experiment not found",
        };
      }

      const experimentEntity = new ExperimentEntity(experiment);
      experimentEntity.complete(success, conclusion);

      // Update in repository
      await this.experimentRepository.save(experimentEntity);

      return {
        success: true,
        data: experimentEntity,
        message: "Experiment completed successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to complete experiment",
      };
    }
  }

  async failExperiment(id: string, reason?: string): Promise<ApiResponse<ExperimentEntity>> {
    try {
      const experiment = await this.experimentRepository.findById(id);
      if (!experiment) {
        return {
          success: false,
          error: "Experiment not found",
        };
      }

      const experimentEntity = new ExperimentEntity(experiment);
      experimentEntity.fail(reason);

      // Update in repository
      await this.experimentRepository.save(experimentEntity);

      return {
        success: true,
        data: experimentEntity,
        message: "Experiment marked as failed",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to mark experiment as failed",
      };
    }
  }

  async cancelExperiment(id: string, reason?: string): Promise<ApiResponse<ExperimentEntity>> {
    try {
      const experiment = await this.experimentRepository.findById(id);
      if (!experiment) {
        return {
          success: false,
          error: "Experiment not found",
        };
      }

      const experimentEntity = new ExperimentEntity(experiment);
      experimentEntity.cancel(reason);

      // Update in repository
      await this.experimentRepository.save(experimentEntity);

      return {
        success: true,
        data: experimentEntity,
        message: "Experiment cancelled successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cancel experiment",
      };
    }
  }

  async searchExperiments(query: string, userId: string, pagination?: Pagination): Promise<ApiResponse<PaginatedResult<ExperimentEntity>>> {
    try {
      const result = await this.experimentRepository.search(query, userId, pagination);

      const experimentEntities = result.data.map(experiment => new ExperimentEntity(experiment));

      return {
        success: true,
        data: {
          ...result,
          data: experimentEntities,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search experiments",
      };
    }
  }
}