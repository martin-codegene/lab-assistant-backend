// AI Service Interface - Abstraction for AI providers
// Every provider adapter implements these interfaces; the active one is
// selected by ai-provider.factory.ts (see AI_PROVIDERS.md).

import { AnalysisType } from "@domain/analysis";

export interface ImageAnalysisInput {
  imageUrl: string;
  analysisType: AnalysisType;
  metadata?: Record<string, any>;
}

export interface ImageAnalysisResult {
  observations: Array<{
    type: string;
    description: string;
    confidence?: number;
    location?: string;
    metadata?: Record<string, any>;
  }>;
  recommendations: Array<{
    action: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    rationale?: string;
    estimatedTime?: string;
    resources?: string[];
  }>;
  nextSteps: Array<{
    step: string;
    description: string;
    dependencies?: string[];
  }>;
  confidence?: number;
  processingTime: number;
}

export interface TextAnalysisInput {
  prompt: string;
  context?: Record<string, any>;
  analysisType: AnalysisType;
}

export interface TextAnalysisResult {
  observations: Array<{
    type: string;
    description: string;
    confidence?: number;
    metadata?: Record<string, any>;
  }>;
  recommendations: Array<{
    action: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    rationale?: string;
    estimatedTime?: string;
    resources?: string[];
  }>;
  nextSteps: Array<{
    step: string;
    description: string;
    dependencies?: string[];
  }>;
  confidence?: number;
  processingTime: number;
}

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatResult {
  message: ChatMessage;
}

export interface IAIService {
  // Image analysis (for gel images, western blots, microscopy)
  analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult>;
  
  // Text-based analysis (for troubleshooting, protocol optimization)
  analyzeText(input: TextAnalysisInput): Promise<TextAnalysisResult>;
  
  chat(messages: ChatMessage[]): Promise<ChatResult>;
  
  // Check if service is available
  isAvailable(): Promise<boolean>;
  
  // Get service name
  getServiceName(): string;
}

// Real-time AI Service - For streaming responses with multimodal input
// Used for live guidance during experiments with video/audio input
export interface IRealtimeAIService {
  // Initialize session with system context
  startSession(config: {
    systemPrompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<void>;

  // Send visual input (base64 encoded frame)
  sendFrame(frameBase64: string, mimeType?: string): Promise<void>;

  // Send audio input (base64 encoded audio chunk)
  sendAudioChunk(audioBase64: string): Promise<void>;

  // Register callback for text stream chunks
  onTextDelta(callback: (text: string) => void): void;

  // Register callback for audio response chunks
  onAudioChunk(callback: (chunk: Buffer) => void): void;

  // Interrupt current response
  interrupt(): Promise<void>;

  // Close session and cleanup
  close(): Promise<void>;

  // Check if session is active
  isActive(): boolean;
}

// Text-to-speech - Turns streamed guidance text into audio for the client.
// Kept separate from the model provider so either side can be swapped alone.
export interface ITextToSpeech {
  // Buffer a text delta; emits audio once a full sentence is available
  accumulateAndSpeak(
    textDelta: string,
    onAudioChunk: (chunk: Buffer) => void,
  ): Promise<void>;

  // Drop any buffered text
  reset(): void;
}

// AI Provider - One pluggable backend (Meta, mock, …). Register new ones in
// ai-provider.factory.ts; select with AI_PROVIDER / AI_REALTIME_PROVIDER.
export interface AIProvider {
  name: string;
  createAIService(): IAIService;
  // Called once per realtime consumer — sessions are stateful
  createRealtimeAIService(tts?: ITextToSpeech): IRealtimeAIService;
}
