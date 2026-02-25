import { Pagination, PaginatedResult, ApiResponse } from "@shared/types";
import { IAttachmentRepository } from "@domain/repositories";
import { IExperimentRepository } from "@domain/repositories";
import {
  AttachmentEntity,
  CreateAttachmentInput,
  UpdateAttachmentInput,
  AttachmentType,
} from "@domain/attachment";

export class AttachmentUseCases {
  constructor(
    private attachmentRepository: IAttachmentRepository,
    private experimentRepository: IExperimentRepository,
  ) {}

  async createAttachment(
    input: CreateAttachmentInput,
  ): Promise<ApiResponse<AttachmentEntity>> {
    try {
      // Verify the experiment exists
      const experiment = await this.experimentRepository.findById(
        input.experimentId,
      );
      if (!experiment) {
        return {
          success: false,
          error: "Experiment not found",
        };
      }

      // Build and validate the entity
      const attachment = AttachmentEntity.create(input);

      const validation = attachment.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      await this.attachmentRepository.save(attachment);

      return {
        success: true,
        data: attachment,
        message: "Attachment created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create attachment",
      };
    }
  }

  async getAttachmentById(id: string): Promise<ApiResponse<AttachmentEntity>> {
    try {
      const attachment = await this.attachmentRepository.findById(id);
      if (!attachment) {
        return {
          success: false,
          error: "Attachment not found",
        };
      }

      return {
        success: true,
        data: new AttachmentEntity(attachment),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get attachment",
      };
    }
  }

  async updateAttachment(
    id: string,
    input: UpdateAttachmentInput,
  ): Promise<ApiResponse<AttachmentEntity>> {
    try {
      const attachment = await this.attachmentRepository.findById(id);
      if (!attachment) {
        return {
          success: false,
          error: "Attachment not found",
        };
      }

      const entity = new AttachmentEntity(attachment);
      entity.update(input);

      const validation = entity.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      await this.attachmentRepository.save(entity);

      return {
        success: true,
        data: entity,
        message: "Attachment updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update attachment",
      };
    }
  }

  async deleteAttachment(id: string): Promise<ApiResponse<void>> {
    try {
      const attachment = await this.attachmentRepository.findById(id);
      if (!attachment) {
        return {
          success: false,
          error: "Attachment not found",
        };
      }

      await this.attachmentRepository.delete(id);

      return {
        success: true,
        data: undefined,
        message: "Attachment deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete attachment",
      };
    }
  }

  async listExperimentAttachments(
    experimentId: string,
    pagination?: Pagination,
    filters?: { type?: AttachmentType },
  ): Promise<ApiResponse<PaginatedResult<AttachmentEntity>>> {
    try {
      const experiment =
        await this.experimentRepository.findById(experimentId);
      if (!experiment) {
        return {
          success: false,
          error: "Experiment not found",
        };
      }

      const result = await this.attachmentRepository.findByExperiment(
        experimentId,
        pagination,
        filters,
      );

      return {
        success: true,
        data: {
          ...result,
          data: result.data.map((a) => new AttachmentEntity(a)),
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list experiment attachments",
      };
    }
  }

  async listUserAttachments(
    userId: string,
    pagination?: Pagination,
    filters?: { type?: AttachmentType },
  ): Promise<ApiResponse<PaginatedResult<AttachmentEntity>>> {
    try {
      const result = await this.attachmentRepository.findByUser(
        userId,
        pagination,
        filters,
      );

      return {
        success: true,
        data: {
          ...result,
          data: result.data.map((a) => new AttachmentEntity(a)),
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list user attachments",
      };
    }
  }

  async listAttachmentsByType(
    type: AttachmentType,
    pagination?: Pagination,
  ): Promise<ApiResponse<PaginatedResult<AttachmentEntity>>> {
    try {
      const result = await this.attachmentRepository.findByType(
        type,
        pagination,
      );

      return {
        success: true,
        data: {
          ...result,
          data: result.data.map((a) => new AttachmentEntity(a)),
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list attachments by type",
      };
    }
  }

  /**
   * Deletes every attachment belonging to a given experiment.
   * Useful when an experiment itself is deleted.
   */
  async deleteExperimentAttachments(
    experimentId: string,
  ): Promise<ApiResponse<void>> {
    try {
      await this.attachmentRepository.deleteByExperiment(experimentId);

      return {
        success: true,
        data: undefined,
        message: "All experiment attachments deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete experiment attachments",
      };
    }
  }

  /**
   * Verifies ownership — returns an error if the attachment was not uploaded
   * by the given user. Useful in route handlers before allowing mutations.
   */
  async verifyOwnership(
    attachmentId: string,
    userId: string,
  ): Promise<ApiResponse<AttachmentEntity>> {
    try {
      const attachment = await this.attachmentRepository.findById(attachmentId);
      if (!attachment) {
        return {
          success: false,
          error: "Attachment not found",
        };
      }

      if (attachment.uploadedById !== userId) {
        return {
          success: false,
          error: "You do not have permission to modify this attachment",
        };
      }

      return {
        success: true,
        data: new AttachmentEntity(attachment),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to verify attachment ownership",
      };
    }
  }
}
