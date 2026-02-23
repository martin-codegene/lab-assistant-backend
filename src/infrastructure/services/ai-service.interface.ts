// AI Service Interface - Abstraction for AI providers
// This allows switching between different AI services (Amazon Nova, OpenAI, etc.)

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

export interface IAIService {
  // Image analysis (for gel images, western blots, microscopy)
  analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult>;
  
  // Text-based analysis (for troubleshooting, protocol optimization)
  analyzeText(input: TextAnalysisInput): Promise<TextAnalysisResult>;
  
  // Check if service is available
  isAvailable(): Promise<boolean>;
  
  // Get service name
  getServiceName(): string;
}
