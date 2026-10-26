import { BaseEntity, JsonValue } from "@shared/types";
import { Experiment } from "./experiment";
import { User } from "./user";

export enum AnalysisType {
  GEL_IMAGE = "GEL_IMAGE",
  WESTERN_BLOT = "WESTERN_BLOT",
  CELL_MORPHOLOGY = "CELL_MORPHOLOGY",
  TROUBLESHOOTING = "TROUBLESHOOTING",
  PROTOCOL_OPTIMIZATION = "PROTOCOL_OPTIMIZATION",
  DATA_INTERPRETATION = "DATA_INTERPRETATION"
}

export interface AnalysisObservation {
  type: string;
  description: string;
  confidence?: number;
  location?: string;
  metadata?: Record<string, JsonValue>;
}

export interface AnalysisRecommendation {
  action: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  rationale?: string;
  estimatedTime?: string;
  resources?: string[];
}

export interface AnalysisNextStep {
  step: string;
  description: string;
  dependencies?: string[];
}

export interface Analysis extends BaseEntity {
  experimentId: string;
  type: AnalysisType;
  inputData: Record<string, JsonValue>;
  
  // AI Results
  modelUsed: string;
  observations: AnalysisObservation[];
  confidence?: number;
  recommendations: AnalysisRecommendation[];
  nextSteps: AnalysisNextStep[];
  
  // Metadata
  requestedById: string;
  completedAt?: Date;
  processingTime?: number;
  
  // Relations (populated when fetched)
  experiment?: Experiment;
  requestedBy?: User;
}

export interface CreateAnalysisInput {
  experimentId: string;
  type: AnalysisType;
  inputData: Record<string, JsonValue>;
  modelUsed: string;
  requestedById: string;
}

export interface UpdateAnalysisInput {
  observations?: AnalysisObservation[];
  confidence?: number;
  recommendations?: AnalysisRecommendation[];
  nextSteps?: AnalysisNextStep[];
  completedAt?: Date;
  processingTime?: number;
}

export class AnalysisEntity implements Analysis {
  id: string;
  experimentId: string;
  type: AnalysisType;
  inputData: Record<string, JsonValue>;
  modelUsed: string;
  observations: AnalysisObservation[];
  confidence?: number;
  recommendations: AnalysisRecommendation[];
  nextSteps: AnalysisNextStep[];
  requestedById: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  processingTime?: number;
  experiment?: Experiment;
  requestedBy?: User;

  constructor(data: Analysis) {
    this.id = data.id;
    this.experimentId = data.experimentId;
    this.type = data.type;
    this.inputData = data.inputData;
    this.modelUsed = data.modelUsed;
    this.observations = data.observations;
    this.confidence = data.confidence;
    this.recommendations = data.recommendations;
    this.nextSteps = data.nextSteps;
    this.requestedById = data.requestedById;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.completedAt = data.completedAt;
    this.processingTime = data.processingTime;
    this.experiment = data.experiment;
    this.requestedBy = data.requestedBy;
  }

  static create(input: CreateAnalysisInput): AnalysisEntity {
    const now = new Date();
    return new AnalysisEntity({
      id: crypto.randomUUID(),
      experimentId: input.experimentId,
      type: input.type,
      inputData: input.inputData,
      modelUsed: input.modelUsed,
      observations: [],
      recommendations: [],
      nextSteps: [],
      requestedById: input.requestedById,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(input: UpdateAnalysisInput): void {
    if (input.observations !== undefined) this.observations = input.observations;
    if (input.confidence !== undefined) this.confidence = input.confidence;
    if (input.recommendations !== undefined) this.recommendations = input.recommendations;
    if (input.nextSteps !== undefined) this.nextSteps = input.nextSteps;
    if (input.completedAt !== undefined) this.completedAt = input.completedAt;
    if (input.processingTime !== undefined) this.processingTime = input.processingTime;
    this.updatedAt = new Date();
  }

  complete(observations: AnalysisObservation[], recommendations: AnalysisRecommendation[], nextSteps: AnalysisNextStep[], confidence?: number): void {
    this.observations = observations;
    this.recommendations = recommendations;
    this.nextSteps = nextSteps;
    this.confidence = confidence;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.experimentId) {
      errors.push("Experiment ID is required");
    }

    if (!this.type) {
      errors.push("Analysis type is required");
    }

    if (!this.modelUsed) {
      errors.push("Model used is required");
    }

    if (this.completedAt && !this.observations.length) {
      errors.push("Completed analysis must have observations");
    }

    if (this.confidence !== undefined && (this.confidence < 0 || this.confidence > 1)) {
      errors.push("Confidence must be between 0 and 1");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toJSON(): Analysis {
    return {
      id: this.id,
      experimentId: this.experimentId,
      type: this.type,
      inputData: this.inputData,
      modelUsed: this.modelUsed,
      observations: this.observations,
      confidence: this.confidence,
      recommendations: this.recommendations,
      nextSteps: this.nextSteps,
      requestedById: this.requestedById,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
      processingTime: this.processingTime,
      experiment: this.experiment,
      requestedBy: this.requestedBy,
    };
  }
}