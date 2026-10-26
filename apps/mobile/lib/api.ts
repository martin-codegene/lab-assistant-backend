import axios, { AxiosError, AxiosInstance } from "axios";
import * as SecureStore from "expo-secure-store";
import { API_CONFIG } from "@/env";

// Types based on API documentation
export type UserRole = "RESEARCHER" | "LAB_MANAGER" | "ADMIN";
export type PlanType = "FREE" | "PRO" | "ENTERPRISE";
export type ExperimentStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type AssayType =
  | "PCR"
  | "ELISA"
  | "WESTERN_BLOT"
  | "MICROSCOPY"
  | "FLOW_CYTOMETRY"
  | "CELL_CULTURE"
  | "PROTEIN_EXPRESSION"
  | "DNA_SEQUENCING"
  | "OTHER"
  | "GEL";

export const AssayTypeMap = {
  PRC: "PCR",
  Gel: "GEL",
  Western: "WESTERN_BLOT",
  "Cell Culture": "CELL_CULTURE",
  "Protein Expression": "PROTEIN_EXPRESSION",
  "DNA Sequencing": "DNA_SEQUENCING",
  Microscopy: "MICROSCOPY",
  "Flow Cytometry": "FLOW_CYTOMETRY",
  ELISA: "ELISA",
  Other: "OTHER",
};

export const AssayTypeArr = [
  { label: "PCR", value: "PCR" },
  {
    label: "ELISA",
    value: "ELISA",
  },
  {
    label: "Western Blot",
    value: "WESTERN_BLOT",
  },
  {
    label: "Microscopy",
    value: "MICROSCOPY",
  },
  {
    label: "Flow Cytometry",
    value: "FLOW_CYTOMETRY",
  },
  {
    label: "Cell Culture",
    value: "CELL_CULTURE",
  },
  {
    label: "Protein Expression",
    value: "PROTEIN_EXPRESSION",
  },
  {
    label: "DNA Sequencing",
    value: "DNA_SEQUENCING",
  },
  {
    label: "Gel",
    value: "GEL",
  },
  {
    label: "Other",
    value: "OTHER",
  },
];
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: UserRole;
  plan: PlanType;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface ProtocolMaterial {
  name: string;
  quantity: string;
  unit: string;
  catalogNumber?: string;
  supplier?: string;
}

export interface ProtocolStep {
  step: number;
  action: string;
  duration: string;
  notes?: string;
  materials?: string[];
}

export interface ProtocolConditions {
  temperature?: string;
  pH?: string;
  humidity?: string;
  pressure?: string;
  other?: Record<string, any>;
}

export interface Protocol {
  id: string;
  name: string;
  description?: string;
  category: AssayType;
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
  createdBy?: User;
}

export interface Experiment {
  id: string;
  title: string;
  description?: string;
  status: ExperimentStatus;
  protocolId: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  variables: Record<string, any>;
  results?: any[];
  conclusion?: string;
  success?: boolean;
  createdById: string;
  labId?: string;
  createdAt: Date;
  updatedAt: Date;
  protocol?: Protocol;
  createdBy?: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  avatarUrl?: string;
  role?: UserRole;
  plan?: PlanType;
}

export interface UpdateUserData {
  name?: string;
  avatarUrl?: string;
  role?: UserRole;
  plan?: PlanType;
  password?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// ── Upload & Attachment types ──────────────────────────────────────────────

export type AttachmentType =
  | "IMAGE"
  | "VIDEO"
  | "DOCUMENT"
  | "DATA_FILE"
  | "AUDIO";

export interface Upload {
  id: string;
  name: string;
  url: string;
  key: string;
  type: string; // MIME type
  size: number;
  isPublic: boolean;
  uploaderId: string;
  createdAt: string;
  updatedAt: string;
  uploader?: User;
}

export interface Attachment {
  id: string;
  experimentId: string;
  type: AttachmentType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  uploadedById: string;
  uploadedAt: string;
  experiment?: Experiment;
  uploadedBy?: User;
}

export interface CreateAttachmentData {
  experimentId: string;
  type: AttachmentType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
}

// ── Chat Session types ──────────────────────────────────────────────────────
export type ChatMessageRole = "USER" | "ASSISTANT";

export interface ChatSessionMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  experimentId?: string;
  protocolId?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  experiment?: Experiment;
  protocol?: Protocol;
  messages?: ChatSessionMessage[];
}

// ── Analysis types ──────────────────────────────────────────────────────────
export type AnalysisType =
  | "GEL_IMAGE"
  | "WESTERN_BLOT"
  | "CELL_MORPHOLOGY"
  | "TROUBLESHOOTING"
  | "PROTOCOL_OPTIMIZATION"
  | "DATA_INTERPRETATION";

export type AnalysisPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AnalysisObservation {
  type: string;
  description: string;
  confidence?: number;
  location?: string;
  metadata?: Record<string, any>;
}

export interface AnalysisRecommendation {
  action: string;
  priority: AnalysisPriority;
  rationale?: string;
  estimatedTime?: string;
  resources?: string[];
}

export interface AnalysisNextStep {
  step: string;
  description: string;
  dependencies?: string[];
}

export interface Analysis {
  id: string;
  experimentId: string;
  type: AnalysisType;
  inputData: Record<string, any>;
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
}

export interface GelImageAnalysisRequest {
  experimentId: string;
  imageUrl: string;
  metadata?: {
    lanes?: number;
    marker?: string;
    expectedSize?: string;
  };
}

export interface TroubleshootingRequest {
  experimentId: string;
  problem: string;
  context?: {
    protocol?: string;
    reagents?: string[];
    conditions?: Record<string, any>;
  };
}

export interface ProtocolOptimizationRequest {
  experimentId: string;
  currentProtocol: {
    steps: ProtocolStep[];
    materials: ProtocolMaterial[];
    conditions: ProtocolConditions;
  };
  issues?: string[];
}

// Storage keys
const STORAGE_KEYS = {
  TOKEN: "lab_app_token",
  USER: "lab_app_user",
} as const;

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      // timeout: API_CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
      const userStr = await SecureStore.getItemAsync(STORAGE_KEYS.USER);

      if (token && userStr) {
        this.token = token;
        this.user = JSON.parse(userStr);
        this.api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      await this.clearAuthData();
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        if (!config.headers["Authorization"] && this.token) {
          config.headers["Authorization"] = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest) {
          // Token expired or invalid
          await this.clearAuthData();

          // You could implement token refresh logic here if needed
          // For now, just clear auth and let the app handle redirect
        }

        return Promise.reject(error);
      },
    );
  }

  private async setAuthData(token: string, user: User) {
    try {
      this.token = token;
      this.user = user;

      await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));

      this.api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } catch (error) {
      console.error("Failed to set auth data:", error);
      throw error;
    }
  }

  private async clearAuthData() {
    try {
      this.token = null;
      this.user = null;

      await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);

      delete this.api.defaults.headers.common["Authorization"];
    } catch (error) {
      console.error("Failed to clear auth data:", error);
    }
  }

  // Auth methods
  async register(
    data: RegisterData,
  ): Promise<ApiResponse<{ user: User; token: string; expiresIn: string }>> {
    try {
      const response = await this.api.post("/users", data);
      const { token, user } = response.data.data;

      await this.setAuthData(token, user);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async login(
    credentials: LoginCredentials,
  ): Promise<ApiResponse<{ user: User; token: string; expiresIn: string }>> {
    try {
      const response = await this.api.post("/users/login", credentials);
      const { token, user } = response.data.data;

      await this.setAuthData(token, user);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    await this.clearAuthData();
  }

  // User methods
  async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserByEmail(email: string): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.get(
        `/users/email/${encodeURIComponent(email)}`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateUser(
    userId: string,
    data: UpdateUserData,
  ): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.put(`/users/${userId}`, data);

      // Update stored user if it's the current user
      if (this.user?.id === userId && response.data.success) {
        this.user = { ...this.user, ...response.data.data };
        await SecureStore.setItemAsync(
          STORAGE_KEYS.USER,
          JSON.stringify(this.user),
        );
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.delete(`/users/${userId}`);

      // Clear auth if deleting current user
      if (this.user?.id === userId) {
        await this.clearAuthData();
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listUsers(params?: {
    page?: number;
    limit?: number;
    role?: UserRole;
    plan?: PlanType;
  }): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      const response = await this.api.get("/users", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async changePassword(
    userId: string,
    data: ChangePasswordData,
  ): Promise<ApiResponse> {
    try {
      const response = await this.api.post(
        `/users/${userId}/change-password`,
        data,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async recordLogin(userId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post(`/users/${userId}/login-record`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Protocol methods
  async createProtocol(data: {
    name: string;
    description?: string;
    category: AssayType;
    version?: string;
    isPublic?: boolean;
    isTemplate?: boolean;
    materials: ProtocolMaterial[];
    steps: ProtocolStep[];
    conditions: ProtocolConditions;
    safetyNotes?: string;
    references?: string;
  }): Promise<ApiResponse<Protocol>> {
    try {
      const response = await this.api.post("/protocols", data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getProtocol(protocolId: string): Promise<ApiResponse<Protocol>> {
    try {
      const response = await this.api.get(`/protocols/${protocolId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProtocol(
    protocolId: string,
    data: Partial<{
      name: string;
      description: string;
      category: AssayType;
      version: string;
      isPublic: boolean;
      isTemplate: boolean;
      materials: ProtocolMaterial[];
      steps: ProtocolStep[];
      conditions: ProtocolConditions;
      safetyNotes: string;
      references: string;
    }>,
  ): Promise<ApiResponse<Protocol>> {
    try {
      const response = await this.api.put(`/protocols/${protocolId}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteProtocol(protocolId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.delete(`/protocols/${protocolId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listMyProtocols(params?: {
    page?: number;
    limit?: number;
    category?: AssayType;
    isPublic?: boolean;
    isTemplate?: boolean;
  }): Promise<ApiResponse<PaginatedResponse<Protocol>>> {
    try {
      const response = await this.api.get("/protocols/user/my-protocols", {
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listProtocols(params?: {
    page?: number;
    limit?: number;
    category?: AssayType;
    isPublic?: boolean;
    isTemplate?: boolean;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<Protocol>>> {
    try {
      const response = await this.api.get("/protocols", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchProtocols(params: {
    query: string;
    page?: number;
    limit?: number;
    category?: AssayType;
  }): Promise<ApiResponse<PaginatedResponse<Protocol>>> {
    try {
      const response = await this.api.get("/protocols/search", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getProtocolsByCategory(
    category: AssayType,
    params?: { page?: number; limit?: number },
  ): Promise<ApiResponse<PaginatedResponse<Protocol>>> {
    try {
      const response = await this.api.get(`/protocols/category/${category}`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPublicProtocols(params?: {
    page?: number;
    limit?: number;
    category?: AssayType;
  }): Promise<ApiResponse<PaginatedResponse<Protocol>>> {
    try {
      const response = await this.api.get("/protocols/public", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getProtocolTemplates(params?: {
    page?: number;
    limit?: number;
    category?: AssayType;
  }): Promise<ApiResponse<PaginatedResponse<Protocol>>> {
    try {
      const response = await this.api.get("/protocols/templates", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async duplicateProtocol(
    protocolId: string,
    data?: { name?: string; description?: string },
  ): Promise<ApiResponse<Protocol>> {
    try {
      const response = await this.api.post(
        `/protocols/${protocolId}/duplicate`,
        data,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async incrementProtocolUsage(protocolId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post(
        `/protocols/${protocolId}/increment-usage`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Experiment methods
  async createExperiment(data: {
    title: string;
    description?: string;
    protocolId: string;
    variables: Record<string, any>;
    labId?: string;
  }): Promise<ApiResponse<Experiment>> {
    try {
      const response = await this.api.post("/experiments", data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getExperiment(experimentId: string): Promise<ApiResponse<Experiment>> {
    try {
      const response = await this.api.get(`/experiments/${experimentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getExperimentWithAnalyses(
    experimentId: string,
  ): Promise<ApiResponse<Experiment>> {
    try {
      const response = await this.api.get(
        `/experiments/${experimentId}/analyses`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateExperiment(
    experimentId: string,
    data: Partial<{
      title: string;
      description: string;
      status: ExperimentStatus;
      startDate: Date;
      endDate: Date;
      notes: string;
      variables: Record<string, any>;
      results: any[];
      conclusion: string;
      success: boolean;
      labId: string;
    }>,
  ): Promise<ApiResponse<Experiment>> {
    try {
      const response = await this.api.put(`/experiments/${experimentId}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteExperiment(experimentId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.delete(`/experiments/${experimentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listMyExperiments(params?: {
    page?: number;
    limit?: number;
    status?: ExperimentStatus;
    protocolId?: string;
    labId?: string;
  }): Promise<ApiResponse<PaginatedResponse<Experiment>>> {
    try {
      const response = await this.api.get("/experiments/user/my-experiments", {
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listProtocolExperiments(
    protocolId: string,
    params?: { page?: number; limit?: number },
  ): Promise<ApiResponse<PaginatedResponse<Experiment>>> {
    try {
      const response = await this.api.get(
        `/experiments/protocol/${protocolId}`,
        { params },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listLabExperiments(
    labId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: ExperimentStatus;
    },
  ): Promise<ApiResponse<PaginatedResponse<Experiment>>> {
    try {
      const response = await this.api.get(`/experiments/lab/${labId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchExperiments(params: {
    q: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Experiment>>> {
    try {
      const response = await this.api.get("/experiments/search", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async startExperiment(
    experimentId: string,
  ): Promise<ApiResponse<Experiment>> {
    try {
      const response = await this.api.post(
        `/experiments/${experimentId}/start`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async completeExperiment(
    experimentId: string,
    data: { success: boolean; conclusion?: string },
  ): Promise<ApiResponse<Experiment>> {
    try {
      const response = await this.api.post(
        `/experiments/${experimentId}/complete`,
        data,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async failExperiment(
    experimentId: string,
    data?: { reason?: string },
  ): Promise<ApiResponse<Experiment>> {
    try {
      const response = await this.api.post(
        `/experiments/${experimentId}/fail`,
        data,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async cancelExperiment(
    experimentId: string,
    data?: { reason?: string },
  ): Promise<ApiResponse<Experiment>> {
    try {
      const response = await this.api.post(
        `/experiments/${experimentId}/cancel`,
        data,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Analysis methods
  async analyzeGelImage(
    data: GelImageAnalysisRequest,
  ): Promise<ApiResponse<Analysis>> {
    try {
      const response = await this.api.post("/analyses/gel-image", data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async troubleshoot(
    data: TroubleshootingRequest,
  ): Promise<ApiResponse<Analysis>> {
    try {
      const response = await this.api.post("/analyses/troubleshoot", data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async optimizeProtocol(
    data: ProtocolOptimizationRequest,
  ): Promise<ApiResponse<Analysis>> {
    try {
      const response = await this.api.post("/analyses/optimize-protocol", data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAnalysis(analysisId: string): Promise<ApiResponse<Analysis>> {
    try {
      const response = await this.api.get(`/analyses/${analysisId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listExperimentAnalyses(
    experimentId: string,
    params?: { page?: number; limit?: number },
  ): Promise<ApiResponse<PaginatedResponse<Analysis>>> {
    try {
      const response = await this.api.get(
        `/analyses/experiment/${experimentId}`,
        { params },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listMyAnalyses(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Analysis>>> {
    try {
      const response = await this.api.get("/analyses/user/my-analyses", {
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listAnalysesByType(
    type: AnalysisType,
    params?: { page?: number; limit?: number },
  ): Promise<ApiResponse<PaginatedResponse<Analysis>>> {
    try {
      const response = await this.api.get(`/analyses/type/${type}`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listRecentAnalyses(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Analysis>>> {
    try {
      const response = await this.api.get("/analyses/recent", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ── Upload methods ───────────────────────────────────────────────────────

  /**
   * Upload a binary file via multipart/form-data.
   * Uses fetch (not axios) so the browser/React-Native runtime can set the
   * correct Content-Type boundary automatically.
   */
  async uploadFile(
    file: { uri: string; name: string; mimeType?: string },
    isPublic = false,
  ): Promise<ApiResponse<Upload>> {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? "application/octet-stream",
      } as any);
      formData.append("isPublic", isPublic ? "true" : "false");

      const response = await fetch(`${API_CONFIG.BASE_URL}/uploads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          // ⚠️ Do NOT set Content-Type here — let fetch add it with the boundary
        },
        body: formData,
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? `Upload failed (${response.status})`);
      }
      return json;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ── Transcription ────────────────────────────────────────────────────────

  /**
   * Transcribe a recorded voice clip on the backend (Meta speech-to-text).
   * Any format expo-audio records (m4a, aac, 3gp, wav) is accepted.
   */
  async transcribeAudio(audioUri: string): Promise<ApiResponse<{ text: string }>> {
    try {
      const formData = new FormData();
      formData.append("audio", {
        uri: audioUri,
        name: "recording.m4a",
        type: "audio/m4a",
      } as any);

      const response = await fetch(`${API_CONFIG.BASE_URL}/transcribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          // ⚠️ Do NOT set Content-Type here — let fetch add it with the boundary
        },
        body: formData,
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? `Transcription failed (${response.status})`);
      }
      return json;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUpload(uploadId: string): Promise<ApiResponse<Upload>> {
    try {
      const response = await this.api.get(`/uploads/${uploadId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listMyUploads(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Upload>>> {
    try {
      const response = await this.api.get("/uploads/my-uploads", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listPublicUploads(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Upload>>> {
    try {
      const response = await this.api.get("/uploads/public", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async makeUploadPublic(uploadId: string): Promise<ApiResponse<Upload>> {
    try {
      const response = await this.api.patch(`/uploads/${uploadId}/make-public`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async makeUploadPrivate(uploadId: string): Promise<ApiResponse<Upload>> {
    try {
      const response = await this.api.patch(
        `/uploads/${uploadId}/make-private`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteUpload(uploadId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.delete(`/uploads/${uploadId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ── Attachment methods ───────────────────────────────────────────────────

  async createAttachment(
    data: CreateAttachmentData,
  ): Promise<ApiResponse<Attachment>> {
    try {
      const response = await this.api.post("/attachments", data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAttachment(attachmentId: string): Promise<ApiResponse<Attachment>> {
    try {
      const response = await this.api.get(`/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateAttachment(
    attachmentId: string,
    data: { description?: string; thumbnailUrl?: string },
  ): Promise<ApiResponse<Attachment>> {
    try {
      const response = await this.api.put(`/attachments/${attachmentId}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteAttachment(attachmentId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.delete(`/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listExperimentAttachments(
    experimentId: string,
    params?: { page?: number; limit?: number; type?: AttachmentType },
  ): Promise<ApiResponse<PaginatedResponse<Attachment>>> {
    try {
      const response = await this.api.get(
        `/attachments/experiment/${experimentId}`,
        { params },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listMyAttachments(params?: {
    page?: number;
    limit?: number;
    type?: AttachmentType;
  }): Promise<ApiResponse<PaginatedResponse<Attachment>>> {
    try {
      const response = await this.api.get("/attachments/user/my-attachments", {
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listAttachmentsByType(
    type: AttachmentType,
    params?: { page?: number; limit?: number },
  ): Promise<ApiResponse<PaginatedResponse<Attachment>>> {
    try {
      const response = await this.api.get(`/attachments/type/${type}`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async bulkDeleteExperimentAttachments(
    experimentId: string,
  ): Promise<ApiResponse> {
    try {
      const response = await this.api.delete(
        `/attachments/experiment/${experimentId}/all`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Convenience: upload a file then immediately register it as an attachment
   * on the given experiment. Returns the created Attachment record.
   */
  async uploadAndAttach(
    file: { uri: string; name: string; mimeType?: string; size?: number },
    experimentId: string,
    attachmentType: AttachmentType,
    description?: string,
  ): Promise<ApiResponse<Attachment>> {
    // Step 1 — push bytes to storage
    const uploadRes = await this.uploadFile(file);
    if (!uploadRes.success || !uploadRes.data) {
      throw new Error(uploadRes.message ?? "Upload failed");
    }
    const upload = uploadRes.data;

    // Step 2 — register metadata against the experiment
    return this.createAttachment({
      experimentId,
      type: attachmentType,
      fileName: file.name,
      fileSize: file.size ?? upload.size,
      mimeType: file.mimeType ?? upload.type,
      url: upload.url,
      description,
    });
  }

  // ── Chat ─────────────────────────────────────────────────────────────────

  // Legacy stateless chat (kept for backwards compatibility)
  async chat(
    messages: { role: "user" | "assistant"; content: string }[],
  ): Promise<ApiResponse<{ message: { role: "assistant"; content: string } }>> {
    try {
      const response = await this.api.post("/chat", { messages });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Session-based chat methods
  async createChatSession(data?: {
    title?: string;
    experimentId?: string;
    protocolId?: string;
  }): Promise<ApiResponse<ChatSession>> {
    try {
      const response = await this.api.post("/chat/sessions", data || {});
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listChatSessions(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<ChatSession>>> {
    try {
      const response = await this.api.get("/chat/sessions", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getChatSession(sessionId: string): Promise<ApiResponse<ChatSession>> {
    try {
      const response = await this.api.get(`/chat/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateChatSession(
    sessionId: string,
    data: {
      title?: string;
      experimentId?: string | null;
      protocolId?: string | null;
    },
  ): Promise<ApiResponse<ChatSession>> {
    try {
      const response = await this.api.patch(
        `/chat/sessions/${sessionId}`,
        data,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteChatSession(sessionId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.delete(`/chat/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendChatMessage(
    sessionId: string,
    content: string,
  ): Promise<ApiResponse<{ reply: ChatSessionMessage; session: ChatSession }>> {
    try {
      const response = await this.api.post(
        `/chat/sessions/${sessionId}/messages`,
        { content },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getChatMessages(
    sessionId: string,
    params?: { page?: number; limit?: number },
  ): Promise<ApiResponse<PaginatedResponse<ChatSessionMessage>>> {
    try {
      const response = await this.api.get(
        `/chat/sessions/${sessionId}/messages`,
        { params },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async clearChatHistory(sessionId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.delete(
        `/chat/sessions/${sessionId}/messages`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Health check
  async healthCheck(): Promise<
    ApiResponse<{ message: string; version: string; status: string }>
  > {
    try {
      const response = await this.api.get("/");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Utility methods
  getCurrentUser(): User | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse>;

      if (axiosError.response) {
        // Server responded with error
        const { status, data } = axiosError.response;

        switch (status) {
          case 400:
            return new Error(data?.error || "Bad request");
          case 401:
            return new Error("Unauthorized - please login again");
          case 403:
            return new Error("Forbidden - insufficient permissions");
          case 404:
            return new Error("Resource not found");
          case 500:
            return new Error(data?.error || "Server error");
          default:
            return new Error(data?.error || `Unexpected error: ${status}`);
        }
      } else if (axiosError.request) {
        // Request made but no response
        return new Error("No response from server - check your connection");
      }
    }

    // Unknown error
    return new Error(error.message || "An unknown error occurred");
  }
}

// Create and export singleton instance
export const api = new ApiService();

// Export types for convenience
export type { ApiService };

