import { Pagination, PaginatedResult } from "@shared/types";
import { User, UserEntity, CreateUserInput, UpdateUserInput } from "./user";
import {
  Protocol,
  ProtocolEntity,
  CreateProtocolInput,
  UpdateProtocolInput,
  ProtocolCategory,
} from "./protocol";
import {
  Experiment,
  ExperimentEntity,
  CreateExperimentInput,
  UpdateExperimentInput,
  ExperimentStatus,
} from "./experiment";
import {
  Analysis,
  AnalysisEntity,
  CreateAnalysisInput,
  UpdateAnalysisInput,
  AnalysisType,
} from "./analysis";
import {
  Attachment,
  CreateAttachmentInput,
  UpdateAttachmentInput,
  AttachmentType,
} from "./attachment";
import { Upload } from "./upload";
import {
  ChatSession,
  ChatSessionMessage,
  CreateChatMessageInput,
} from "./chat";
import { PlanType, UserRole } from "@prisma/client";

// Generic Repository Interface
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}

// User Repository
export interface IUserRepository extends IRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findMany(
    pagination?: Pagination,
    filters?: { role?: UserRole; plan?: PlanType },
  ): Promise<PaginatedResult<User>>;
  update(id: string, input: UpdateUserInput): Promise<User>;
  updatePassword(id: string, newPassword: string): Promise<void>;
}

// Protocol Repository
export interface IProtocolRepository extends IRepository<Protocol> {
  findByUser(
    userId: string,
    pagination?: Pagination,
    filters?: {
      category?: ProtocolCategory;
      isPublic?: boolean;
      isTemplate?: boolean;
    },
  ): Promise<PaginatedResult<Protocol>>;
  findByCategory(
    category: ProtocolCategory,
    pagination?: Pagination,
  ): Promise<PaginatedResult<Protocol>>;
  findPublicProtocols(
    pagination?: Pagination,
    search?: string,
  ): Promise<PaginatedResult<Protocol>>;
  findTemplates(pagination?: Pagination): Promise<PaginatedResult<Protocol>>;
  incrementUsageCount(id: string): Promise<void>;
  search(
    query: string,
    pagination?: Pagination,
  ): Promise<PaginatedResult<Protocol>>;
}

// Experiment Repository
export interface IExperimentRepository extends IRepository<Experiment> {
  findByUser(
    userId: string,
    pagination?: Pagination,
    filters?: {
      status?: ExperimentStatus;
      protocolId?: string;
      labId?: string;
    },
  ): Promise<PaginatedResult<Experiment>>;
  findByProtocol(
    protocolId: string,
    pagination?: Pagination,
  ): Promise<PaginatedResult<Experiment>>;
  findByLab(
    labId: string,
    pagination?: Pagination,
    filters?: { status?: ExperimentStatus },
  ): Promise<PaginatedResult<Experiment>>;
  findWithAnalyses(experimentId: string): Promise<Experiment | null>;
  updateStatus(id: string, status: ExperimentStatus): Promise<Experiment>;
  search(
    query: string,
    userId: string,
    pagination?: Pagination,
  ): Promise<PaginatedResult<Experiment>>;
}

// Analysis Repository
export interface IAnalysisRepository extends IRepository<Analysis> {
  findByExperiment(
    experimentId: string,
    pagination?: Pagination,
  ): Promise<PaginatedResult<Analysis>>;
  findByType(
    type: AnalysisType,
    pagination?: Pagination,
  ): Promise<PaginatedResult<Analysis>>;
  findByUser(
    userId: string,
    pagination?: Pagination,
  ): Promise<PaginatedResult<Analysis>>;
  findRecent(pagination?: Pagination): Promise<PaginatedResult<Analysis>>;
  updateResults(
    id: string,
    observations: any[],
    recommendations: any[],
    nextSteps: any[],
    confidence?: number,
  ): Promise<Analysis>;
}

// Factory interfaces for complex object creation
export interface IProtocolFactory {
  createPCRProtocol(data: any): ProtocolEntity;
  createWesternBlotProtocol(data: any): ProtocolEntity;
  createCellCultureProtocol(data: any): ProtocolEntity;
}

export interface IAnalysisStrategy {
  analyze(input: any): Promise<any>;
  supports(type: AnalysisType): boolean;
}

export interface IAnalysisStrategyFactory {
  getStrategy(type: AnalysisType): IAnalysisStrategy;
  register(strategy: IAnalysisStrategy): void;
}

// Upload Repository
export interface IUploadRepository {
  findById(id: string): Promise<Upload | null>;
  findByKey(key: string): Promise<Upload | null>;
  save(entity: Upload): Promise<void>;
  delete(id: string): Promise<void>;
  findByUploader(
    uploaderId: string,
    pagination?: Pagination,
  ): Promise<PaginatedResult<Upload>>;
  findPublic(pagination?: Pagination): Promise<PaginatedResult<Upload>>;
}

// Chat Session Repository
export interface IChatSessionRepository {
  findById(id: string): Promise<ChatSession | null>;
  findWithMessages(id: string): Promise<ChatSession | null>;
  save(session: ChatSession): Promise<void>;
  delete(id: string): Promise<void>;
  findByUser(
    userId: string,
    pagination?: Pagination,
  ): Promise<PaginatedResult<ChatSession>>;
  addMessage(input: CreateChatMessageInput): Promise<ChatSessionMessage>;
  getMessages(
    sessionId: string,
    pagination?: Pagination,
  ): Promise<PaginatedResult<ChatSessionMessage>>;
  getAllMessages(sessionId: string): Promise<ChatSessionMessage[]>;
  deleteMessages(sessionId: string): Promise<void>;
}

// Attachment Repository
export interface IAttachmentRepository {
  findById(id: string): Promise<Attachment | null>;
  save(entity: Attachment): Promise<void>;
  delete(id: string): Promise<void>;
  findByExperiment(
    experimentId: string,
    pagination?: Pagination,
    filters?: { type?: AttachmentType },
  ): Promise<PaginatedResult<Attachment>>;
  findByUser(
    userId: string,
    pagination?: Pagination,
    filters?: { type?: AttachmentType },
  ): Promise<PaginatedResult<Attachment>>;
  findByType(
    type: AttachmentType,
    pagination?: Pagination,
  ): Promise<PaginatedResult<Attachment>>;
  deleteByExperiment(experimentId: string): Promise<void>;
}
