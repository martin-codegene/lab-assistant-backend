import { BaseEntity, JsonValue } from "@shared/types";
import { Protocol } from "./protocol";
import { User } from "./user";

export enum ExperimentStatus {
  PLANNED = "PLANNED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED"
}

export interface Experiment extends BaseEntity {
  title: string;
  description?: string;
  status: ExperimentStatus;
  
  // Protocol Reference
  protocolId: string;
  
  // Experiment Details
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  variables: Record<string, JsonValue>;
  
  // Results
  results?: JsonValue[];
  conclusion?: string;
  success?: boolean;
  
  // Metadata
  createdById: string;
  labId?: string;
  
  // Relations (populated when fetched)
  protocol?: Protocol;
  createdBy?: User;
}

export interface CreateExperimentInput {
  title: string;
  description?: string;
  protocolId: string;
  variables: Record<string, JsonValue>;
  labId?: string;
  createdById: string;
}

export interface UpdateExperimentInput {
  title?: string;
  description?: string;
  status?: ExperimentStatus;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  variables?: Record<string, JsonValue>;
  results?: JsonValue[];
  conclusion?: string;
  success?: boolean;
  labId?: string;
}

export class ExperimentEntity implements Experiment {
  id: string;
  title: string;
  description?: string;
  status: ExperimentStatus;
  protocolId: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  variables: Record<string, JsonValue>;
  results?: JsonValue[];
  conclusion?: string;
  success?: boolean;
  createdById: string;
  labId?: string;
  createdAt: Date;
  updatedAt: Date;
  protocol?: Protocol;
  createdBy?: User;

  constructor(data: Experiment) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.status = data.status;
    this.protocolId = data.protocolId;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.notes = data.notes;
    this.variables = data.variables;
    this.results = data.results;
    this.conclusion = data.conclusion;
    this.success = data.success;
    this.createdById = data.createdById;
    this.labId = data.labId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.protocol = data.protocol;
    this.createdBy = data.createdBy;
  }

  static create(input: CreateExperimentInput): ExperimentEntity {
    const now = new Date();
    return new ExperimentEntity({
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      status: ExperimentStatus.PLANNED,
      protocolId: input.protocolId,
      variables: input.variables,
      createdById: input.createdById,
      labId: input.labId,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(input: UpdateExperimentInput): void {
    if (input.title !== undefined) this.title = input.title;
    if (input.description !== undefined) this.description = input.description;
    if (input.status !== undefined) this.status = input.status;
    if (input.startDate !== undefined) this.startDate = input.startDate;
    if (input.endDate !== undefined) this.endDate = input.endDate;
    if (input.notes !== undefined) this.notes = input.notes;
    if (input.variables !== undefined) this.variables = input.variables;
    if (input.results !== undefined) this.results = input.results;
    if (input.conclusion !== undefined) this.conclusion = input.conclusion;
    if (input.success !== undefined) this.success = input.success;
    if (input.labId !== undefined) this.labId = input.labId;
    this.updatedAt = new Date();
  }

  start(): void {
    if (this.status !== ExperimentStatus.PLANNED) {
      throw new Error("Experiment can only be started from PLANNED status");
    }
    this.status = ExperimentStatus.IN_PROGRESS;
    this.startDate = new Date();
    this.updatedAt = new Date();
  }

  complete(success: boolean, conclusion?: string): void {
    if (this.status !== ExperimentStatus.IN_PROGRESS) {
      throw new Error("Experiment can only be completed from IN_PROGRESS status");
    }
    this.status = ExperimentStatus.COMPLETED;
    this.endDate = new Date();
    this.success = success;
    if (conclusion) this.conclusion = conclusion;
    this.updatedAt = new Date();
  }

  fail(reason?: string): void {
    if (this.status !== ExperimentStatus.IN_PROGRESS) {
      throw new Error("Experiment can only be failed from IN_PROGRESS status");
    }
    this.status = ExperimentStatus.FAILED;
    this.endDate = new Date();
    this.success = false;
    if (reason) this.conclusion = reason;
    this.updatedAt = new Date();
  }

  cancel(reason?: string): void {
    if (this.status === ExperimentStatus.COMPLETED || this.status === ExperimentStatus.FAILED) {
      throw new Error("Cannot cancel a completed or failed experiment");
    }
    this.status = ExperimentStatus.CANCELLED;
    this.endDate = new Date();
    if (reason) this.conclusion = reason;
    this.updatedAt = new Date();
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push("Experiment title is required");
    }

    if (this.title.length > 200) {
      errors.push("Experiment title must be less than 200 characters");
    }

    if (!this.protocolId) {
      errors.push("Protocol ID is required");
    }

    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      errors.push("Start date cannot be after end date");
    }

    if (this.status === ExperimentStatus.COMPLETED && this.success === undefined) {
      errors.push("Success status must be set for completed experiments");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toJSON(): Experiment {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      protocolId: this.protocolId,
      startDate: this.startDate,
      endDate: this.endDate,
      notes: this.notes,
      variables: this.variables,
      results: this.results,
      conclusion: this.conclusion,
      success: this.success,
      createdById: this.createdById,
      labId: this.labId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      protocol: this.protocol,
      createdBy: this.createdBy,
    };
  }
}