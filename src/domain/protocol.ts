import { BaseEntity, JsonValue } from "@shared/types";
import { User, UserPublic } from "./user";

export enum ProtocolCategory {
  PCR = "PCR",
  WESTERN_BLOT = "WESTERN_BLOT",
  CELL_CULTURE = "CELL_CULTURE",
  PROTEIN_EXPRESSION = "PROTEIN_EXPRESSION",
  DNA_SEQUENCING = "DNA_SEQUENCING",
  MICROSCOPY = "MICROSCOPY",
  FLOW_CYTOMETRY = "FLOW_CYTOMETRY",
  ELISA = "ELISA",
  OTHER = "OTHER"
}

export interface ProtocolStep {
  step: number;
  action: string;
  duration: string;
  notes?: string;
  materials?: string[];
}

export interface ProtocolMaterial {
  name: string;
  quantity: string;
  unit: string;
  catalogNumber?: string;
  supplier?: string;
}

export interface ProtocolConditions {
  temperature?: string;
  time?: string;
  pH?: string;
  pressure?: string;
  cycles?: string;
  other?: Record<string, string>;
}

export interface Protocol extends BaseEntity {
  name: string;
  description?: string;
  category: ProtocolCategory;
  version: string;
  isPublic: boolean;
  isTemplate: boolean;
  
  // Protocol Details
  materials: ProtocolMaterial[];
  steps: ProtocolStep[];
  conditions: ProtocolConditions;
  safetyNotes?: string;
  references?: string;
  
  // Metadata
  createdById: string;
  lastUsedAt?: Date;
  usageCount: number;
  
  // Relations (populated when fetched)
  createdBy?: UserPublic;
}

export interface CreateProtocolInput {
  name: string;
  description?: string;
  category: ProtocolCategory;
  version?: string;
  isPublic?: boolean;
  isTemplate?: boolean;
  materials: ProtocolMaterial[];
  steps: ProtocolStep[];
  conditions: ProtocolConditions;
  safetyNotes?: string;
  references?: string;
  createdById: string;
}

export interface UpdateProtocolInput {
  name?: string;
  description?: string;
  category?: ProtocolCategory;
  version?: string;
  isPublic?: boolean;
  isTemplate?: boolean;
  materials?: ProtocolMaterial[];
  steps?: ProtocolStep[];
  conditions?: ProtocolConditions;
  safetyNotes?: string;
  references?: string;
}

export class ProtocolEntity implements Protocol {
  id: string;
  name: string;
  description?: string;
  category: ProtocolCategory;
  version: string;
  isPublic: boolean;
  isTemplate: boolean;
  materials: ProtocolMaterial[];
  steps: ProtocolStep[];
  conditions: ProtocolConditions;
  safetyNotes?: string;
  references?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
  createdBy?: UserPublic;

  constructor(data: Protocol) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.category = data.category;
    this.version = data.version;
    this.isPublic = data.isPublic;
    this.isTemplate = data.isTemplate;
    this.materials = data.materials;
    this.steps = data.steps;
    this.conditions = data.conditions;
    this.safetyNotes = data.safetyNotes;
    this.references = data.references;
    this.createdById = data.createdById;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.lastUsedAt = data.lastUsedAt;
    this.usageCount = data.usageCount;
    this.createdBy = data.createdBy;
  }

  static create(input: CreateProtocolInput): ProtocolEntity {
    const now = new Date();
    return new ProtocolEntity({
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      category: input.category,
      version: input.version || "1.0.0",
      isPublic: input.isPublic || false,
      isTemplate: input.isTemplate || false,
      materials: input.materials,
      steps: input.steps,
      conditions: input.conditions,
      safetyNotes: input.safetyNotes,
      references: input.references,
      createdById: input.createdById,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    });
  }

  update(input: UpdateProtocolInput): void {
    if (input.name !== undefined) this.name = input.name;
    if (input.description !== undefined) this.description = input.description;
    if (input.category !== undefined) this.category = input.category;
    if (input.version !== undefined) this.version = input.version;
    if (input.isPublic !== undefined) this.isPublic = input.isPublic;
    if (input.isTemplate !== undefined) this.isTemplate = input.isTemplate;
    if (input.materials !== undefined) this.materials = input.materials;
    if (input.steps !== undefined) this.steps = input.steps;
    if (input.conditions !== undefined) this.conditions = input.conditions;
    if (input.safetyNotes !== undefined) this.safetyNotes = input.safetyNotes;
    if (input.references !== undefined) this.references = input.references;
    this.updatedAt = new Date();
  }

  recordUsage(): void {
    this.usageCount += 1;
    this.lastUsedAt = new Date();
    this.updatedAt = new Date();
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push("Protocol name is required");
    }

    if (this.name.length > 200) {
      errors.push("Protocol name must be less than 200 characters");
    }

    if (this.steps.length === 0) {
      errors.push("Protocol must have at least one step");
    }

    // Validate steps
    this.steps.forEach((step, index) => {
      if (!step.action || step.action.trim().length === 0) {
        errors.push(`Step ${index + 1}: Action is required`);
      }
      if (step.step !== index + 1) {
        errors.push(`Step ${index + 1}: Step number must be sequential`);
      }
    });

    // Validate materials
    this.materials.forEach((material, index) => {
      if (!material.name || material.name.trim().length === 0) {
        errors.push(`Material ${index + 1}: Name is required`);
      }
      if (!material.quantity || material.quantity.trim().length === 0) {
        errors.push(`Material ${index + 1}: Quantity is required`);
      }
      if (!material.unit || material.unit.trim().length === 0) {
        errors.push(`Material ${index + 1}: Unit is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toJSON(): Protocol {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      version: this.version,
      isPublic: this.isPublic,
      isTemplate: this.isTemplate,
      materials: this.materials,
      steps: this.steps,
      conditions: this.conditions,
      safetyNotes: this.safetyNotes,
      references: this.references,
      createdById: this.createdById,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastUsedAt: this.lastUsedAt,
      usageCount: this.usageCount,
      createdBy: this.createdBy,
    };
  }
}