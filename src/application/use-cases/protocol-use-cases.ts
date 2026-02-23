import { IProtocolRepository } from "@domain/repositories";
import {
  Protocol,
  ProtocolEntity,
  CreateProtocolInput,
  UpdateProtocolInput,
  ProtocolCategory,
} from "@domain/protocol";
import { Pagination, PaginatedResult, Result } from "@shared/types";

export class ProtocolUseCases {
  constructor(private protocolRepository: IProtocolRepository) {}

  async createProtocol(input: CreateProtocolInput): Promise<Result<Protocol>> {
    try {
      // Create protocol entity
      const protocol = ProtocolEntity.create(input);

      // Validate protocol
      const validation = protocol.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      // Save to repository
      await this.protocolRepository.save(protocol);

      return {
        success: true,
        data: protocol.toJSON(),
        message: "Protocol created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create protocol",
      };
    }
  }

  async getProtocolById(id: string): Promise<Result<Protocol>> {
    try {
      const protocol = await this.protocolRepository.findById(id);

      if (!protocol) {
        return {
          success: false,
          error: "Protocol not found",
        };
      }

      return {
        success: true,
        data: protocol,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get protocol",
      };
    }
  }

  async updateProtocol(id: string, input: UpdateProtocolInput): Promise<Result<Protocol>> {
    try {
      // Get existing protocol
      const existing = await this.protocolRepository.findById(id);

      if (!existing) {
        return {
          success: false,
          error: "Protocol not found",
        };
      }

      // Create entity and update
      const protocol = new ProtocolEntity(existing);
      protocol.update(input);

      // Validate updated protocol
      const validation = protocol.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      // Delete and re-save (Prisma update with JSON fields)
      await this.protocolRepository.delete(id);
      await this.protocolRepository.save(protocol);

      return {
        success: true,
        data: protocol.toJSON(),
        message: "Protocol updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update protocol",
      };
    }
  }

  async deleteProtocol(id: string): Promise<Result<void>> {
    try {
      const protocol = await this.protocolRepository.findById(id);

      if (!protocol) {
        return {
          success: false,
          error: "Protocol not found",
        };
      }

      await this.protocolRepository.delete(id);

      return {
        success: true,
        message: "Protocol deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete protocol",
      };
    }
  }

  async listUserProtocols(
    userId: string,
    pagination?: Pagination,
    filters?: { category?: ProtocolCategory; isPublic?: boolean; isTemplate?: boolean }
  ): Promise<Result<PaginatedResult<Protocol>>> {
    try {
      const result = await this.protocolRepository.findByUser(userId, pagination, filters);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list protocols",
      };
    }
  }

  async listPublicProtocols(
    pagination?: Pagination,
    search?: string
  ): Promise<Result<PaginatedResult<Protocol>>> {
    try {
      const result = await this.protocolRepository.findPublicProtocols(pagination, search);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list public protocols",
      };
    }
  }

  async listProtocolsByCategory(
    category: ProtocolCategory,
    pagination?: Pagination
  ): Promise<Result<PaginatedResult<Protocol>>> {
    try {
      const result = await this.protocolRepository.findByCategory(category, pagination);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list protocols by category",
      };
    }
  }

  async listTemplates(pagination?: Pagination): Promise<Result<PaginatedResult<Protocol>>> {
    try {
      const result = await this.protocolRepository.findTemplates(pagination);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list templates",
      };
    }
  }

  async searchProtocols(
    query: string,
    pagination?: Pagination
  ): Promise<Result<PaginatedResult<Protocol>>> {
    try {
      if (!query || query.trim().length === 0) {
        return {
          success: false,
          error: "Search query is required",
        };
      }

      const result = await this.protocolRepository.search(query, pagination);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search protocols",
      };
    }
  }

  async recordProtocolUsage(id: string): Promise<Result<void>> {
    try {
      const protocol = await this.protocolRepository.findById(id);

      if (!protocol) {
        return {
          success: false,
          error: "Protocol not found",
        };
      }

      await this.protocolRepository.incrementUsageCount(id);

      return {
        success: true,
        message: "Protocol usage recorded",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to record protocol usage",
      };
    }
  }

  async duplicateProtocol(id: string, userId: string): Promise<Result<Protocol>> {
    try {
      const original = await this.protocolRepository.findById(id);

      if (!original) {
        return {
          success: false,
          error: "Protocol not found",
        };
      }

      // Create a copy with new ID and owner
      const duplicate = ProtocolEntity.create({
        name: `${original.name} (Copy)`,
        description: original.description,
        category: original.category,
        version: original.version,
        isPublic: false, // Copies are private by default
        isTemplate: false,
        materials: original.materials,
        steps: original.steps,
        conditions: original.conditions,
        safetyNotes: original.safetyNotes,
        references: original.references,
        createdById: userId,
      });

      await this.protocolRepository.save(duplicate);

      return {
        success: true,
        data: duplicate.toJSON(),
        message: "Protocol duplicated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to duplicate protocol",
      };
    }
  }
}
