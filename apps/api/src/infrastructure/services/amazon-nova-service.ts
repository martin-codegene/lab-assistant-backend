// Amazon Nova AI Service Adapter
// This is where you integrate with Amazon Nova API

import {
  IAIService,
  ImageAnalysisInput,
  ImageAnalysisResult,
  TextAnalysisInput,
  TextAnalysisResult,
  ChatMessage,
  ChatResult,
} from "./ai-service.interface";
import { AnalysisType } from "@domain/analysis";

export interface NovaConfig {
  apiKey?: string;
  region?: string;
  endpoint?: string;
  model?: {
    multimodal?: string; // For image analysis
    text?: string; // For text analysis
    voice?: string; // For voice interactions
  };
}

export class AmazonNovaService implements IAIService {
  private config: NovaConfig;
  private isConfigured: boolean;

  constructor(config?: NovaConfig) {
    this.config = config || this.loadConfigFromEnv();
    this.isConfigured = this.validateConfig();
  }

  private loadConfigFromEnv(): NovaConfig {
    return {
      apiKey: process.env.AMAZON_NOVA_API_KEY,
      region: process.env.AMAZON_NOVA_REGION || "us-east-1",
      endpoint: process.env.AMAZON_NOVA_ENDPOINT,
      model: {
        multimodal:
          process.env.AMAZON_NOVA_MULTIMODAL_MODEL || "nova-multimodal-v1",
        text: process.env.AMAZON_NOVA_TEXT_MODEL || "nova-2-lite",
        voice: process.env.AMAZON_NOVA_VOICE_MODEL || "nova-2-sonic",
      },
    };
  }

  private validateConfig(): boolean {
    // Check if required configuration is present
    return !!(this.config.apiKey || this.config.endpoint);
  }

  getServiceName(): string {
    return "Amazon Nova";
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      // TODO: Implement actual health check to Amazon Nova API
      // For now, just check if config is present
      return true;
    } catch (error) {
      console.error("Amazon Nova service unavailable:", error);
      return false;
    }
  }

  async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult> {
    const startTime = Date.now();

    if (!this.isConfigured) {
      throw new Error(
        "Amazon Nova service is not configured. Please set AMAZON_NOVA_API_KEY in environment variables.",
      );
    }

    try {
      const prompt = this.buildImageAnalysisPrompt(input);

      const response = await fetch(`${this.config.endpoint}chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model?.text,
          messages: [
            {
              role: "system",
              content: `You are an expert laboratory scientist specializing in image analysis. \
Analyze the provided lab image and return your analysis strictly as valid JSON in the following shape:
{
  "observations": [
    { "type": "string", "description": "string", "confidence": <number 0-1>, "location": "string (optional)", "metadata": {} }
  ],
  "recommendations": [
    { "action": "string", "priority": "LOW|MEDIUM|HIGH|CRITICAL", "rationale": "string", "estimatedTime": "string (optional)" }
  ],
  "next_steps": [
    { "step": "string", "description": "string", "dependencies": ["string"] }
  ],
  "confidence": <number 0-1>
}
Return ONLY the raw JSON object. Do not wrap it in markdown code fences or include any other text.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: input.imageUrl,
                  },
                },
              ],
            },
          ],
        }),
      });

      const res = await response.json();
      console.log(res);
      const raw = res.choices[0].message.content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsedRes = JSON.parse(raw);

      return {
        observations: parsedRes.observations,
        recommendations: parsedRes.recommendations,
        nextSteps: parsedRes.next_steps,
        confidence: parsedRes.confidence,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Amazon Nova image analysis error:", error);
      throw new Error(
        `Failed to analyze image: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private buildImageAnalysisPrompt(input: ImageAnalysisInput): string {
    const baseContext =
      input.metadata && Object.keys(input.metadata).length > 0
        ? `\nAdditional context: ${JSON.stringify(input.metadata)}`
        : "";

    switch (input.analysisType) {
      case AnalysisType.GEL_IMAGE:
        return `Analyze this gel electrophoresis image. Identify and evaluate:
- Band positions and estimated molecular weights
- Band intensity and uniformity across lanes
- Presence of primer dimers or non-specific amplification bands
- Overall PCR product quality and purity
- Lane-by-lane assessment including any anomalies${baseContext}`;

      case AnalysisType.WESTERN_BLOT:
        return `Analyze this western blot image. Identify and evaluate:
- Target protein bands and their apparent molecular weights
- Background signal level and signal-to-noise ratio
- Band intensity and consistency across sample lanes
- Evidence of non-specific binding or cross-reactivity
- Overall blot quality and transfer efficiency${baseContext}`;

      case AnalysisType.CELL_MORPHOLOGY:
        return `Analyze this cell microscopy image. Identify and evaluate:
- Cell morphology and health indicators
- Cell density and estimated confluence percentage
- Presence of dead, stressed, or abnormal cells
- Any signs of contamination (bacterial, fungal, or mycoplasma)
- Overall culture condition and suitability for experimentation${baseContext}`;

      default:
        return `Analyze this laboratory image (analysis type: ${input.analysisType}). Provide detailed scientific observations, actionable recommendations, and suggested next steps.${baseContext}`;
    }
  }

  async analyzeText(input: TextAnalysisInput): Promise<TextAnalysisResult> {
    const startTime = Date.now();

    if (!this.isConfigured) {
      throw new Error(
        "Amazon Nova service is not configured. Please set AMAZON_NOVA_API_KEY in environment variables.",
      );
    }

    try {
      // TODO: Replace this with actual Amazon Nova API call
      // Example integration:
      const response = await fetch(`${this.config.endpoint}chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model?.text,
          prompt: input.prompt,
          context: input.context,
          analysis_type: input.analysisType,
          messages: [
            {
              role: "user",
              content: input.prompt,
            },
          ],
        }),
      });

      // console.log(await response.json())
      const res = await response.json();
      const parsedRes = JSON.parse(
        res.choices[0].message.content
          .replace("```json", "")
          .replace("```", ""),
      );

      return {
        observations: parsedRes.observations,
        recommendations: parsedRes.recommendations,
        nextSteps: parsedRes.next_steps,
        confidence: parsedRes.confidence,
        processingTime: Date.now() - startTime,
      };

      // Mock response for development
      return this.getMockTextAnalysis(input, startTime);
    } catch (error) {
      console.error("Amazon Nova text analysis error:", error);
      throw new Error(
        `Failed to analyze text: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async chat(messages: ChatMessage[]): Promise<ChatResult> {
    if (!this.isConfigured) {
      throw new Error(
        "Amazon Nova service is not configured. Please set AMAZON_NOVA_API_KEY in environment variables.",
      );
    }

    try {
      const response = await fetch(`${this.config.endpoint}chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model?.text,
          messages,
        }),
      });

      const data = await response.json();
      const choice = data.choices && data.choices[0] && data.choices[0].message;

      if (!choice || typeof choice.content !== "string") {
        throw new Error("Invalid response from AI chat service");
      }

      return {
        message: {
          role: choice.role,
          content: choice.content,
        },
      };
    } catch (error) {
      console.error("Amazon Nova chat error:", error);
      throw new Error(
        `Failed to chat with AI service: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Mock responses for development/testing
  private getMockImageAnalysis(
    input: ImageAnalysisInput,
    startTime: number,
  ): ImageAnalysisResult {
    const processingTime = Date.now() - startTime;

    switch (input.analysisType) {
      case AnalysisType.GEL_IMAGE:
        return {
          observations: [
            {
              type: "band_detection",
              description: "Clear bands visible at expected molecular weight",
              confidence: 0.92,
              location: "Lane 1-3",
            },
            {
              type: "quality_assessment",
              description: "No primer dimers detected",
              confidence: 0.88,
            },
            {
              type: "intensity_analysis",
              description: "Uniform band intensity across samples",
              confidence: 0.85,
              metadata: { average_intensity: 245 },
            },
          ],
          recommendations: [
            {
              action: "Proceed with sequencing",
              priority: "HIGH",
              rationale: "PCR products show expected size and purity",
            },
            {
              action: "Consider reducing cycle number",
              priority: "LOW",
              rationale: "Slight over-amplification detected",
              estimatedTime: "5 minutes",
            },
          ],
          nextSteps: [
            {
              step: "Purify PCR products",
              description: "Use column purification kit",
            },
            {
              step: "Quantify DNA concentration",
              description: "Use NanoDrop or Qubit",
              dependencies: ["Purify PCR products"],
            },
          ],
          confidence: 0.9,
          processingTime,
        };

      case AnalysisType.WESTERN_BLOT:
        return {
          observations: [
            {
              type: "protein_detection",
              description:
                "Target protein detected at expected molecular weight (55 kDa)",
              confidence: 0.89,
            },
            {
              type: "background_assessment",
              description: "Low background signal, good signal-to-noise ratio",
              confidence: 0.91,
            },
          ],
          recommendations: [
            {
              action: "Quantify band intensity",
              priority: "HIGH",
              rationale: "For comparative analysis between samples",
            },
          ],
          nextSteps: [
            {
              step: "Perform densitometry analysis",
              description: "Use ImageJ or similar software",
            },
          ],
          confidence: 0.88,
          processingTime,
        };

      case AnalysisType.CELL_MORPHOLOGY:
        return {
          observations: [
            {
              type: "cell_health",
              description: "Cells appear healthy with normal morphology",
              confidence: 0.87,
            },
            {
              type: "confluence",
              description: "Approximately 80% confluent",
              confidence: 0.92,
            },
          ],
          recommendations: [
            {
              action: "Ready for passage or experiment",
              priority: "MEDIUM",
              rationale: "Optimal confluence reached",
            },
          ],
          nextSteps: [
            {
              step: "Proceed with planned experiment",
              description: "Cells are in optimal condition",
            },
          ],
          confidence: 0.89,
          processingTime,
        };

      default:
        return {
          observations: [
            {
              type: "general_analysis",
              description: "Image analysis completed",
              confidence: 0.75,
            },
          ],
          recommendations: [],
          nextSteps: [],
          confidence: 0.75,
          processingTime,
        };
    }
  }

  private getMockTextAnalysis(
    input: TextAnalysisInput,
    startTime: number,
  ): TextAnalysisResult {
    const processingTime = Date.now() - startTime;

    switch (input.analysisType) {
      case AnalysisType.TROUBLESHOOTING:
        return {
          observations: [
            {
              type: "issue_identification",
              description: "Possible contamination or reagent degradation",
              confidence: 0.85,
            },
            {
              type: "root_cause",
              description:
                "Template DNA may be degraded or concentration too low",
              confidence: 0.78,
            },
          ],
          recommendations: [
            {
              action: "Check DNA quality on gel",
              priority: "CRITICAL",
              rationale: "Verify template integrity before proceeding",
              estimatedTime: "30 minutes",
            },
            {
              action: "Prepare fresh master mix",
              priority: "HIGH",
              rationale: "Eliminate possibility of reagent degradation",
              estimatedTime: "15 minutes",
            },
            {
              action: "Increase template concentration",
              priority: "MEDIUM",
              rationale: "May improve amplification efficiency",
            },
          ],
          nextSteps: [
            {
              step: "Run diagnostic gel",
              description: "Check template DNA quality",
            },
            {
              step: "Optimize PCR conditions",
              description: "Adjust annealing temperature and cycle number",
              dependencies: ["Run diagnostic gel"],
            },
          ],
          confidence: 0.82,
          processingTime,
        };

      case AnalysisType.PROTOCOL_OPTIMIZATION:
        return {
          observations: [
            {
              type: "efficiency_analysis",
              description:
                "Current protocol can be optimized for time and reagent usage",
              confidence: 0.88,
            },
            {
              type: "cost_analysis",
              description: "Potential 20% reduction in reagent costs",
              confidence: 0.82,
            },
          ],
          recommendations: [
            {
              action: "Reduce annealing time to 20 seconds",
              priority: "MEDIUM",
              rationale: "Shorter annealing time sufficient for primer length",
              estimatedTime: "Saves 15 minutes per run",
            },
            {
              action: "Use hot-start polymerase",
              priority: "HIGH",
              rationale: "Reduces non-specific amplification",
            },
            {
              action: "Optimize primer concentration",
              priority: "MEDIUM",
              rationale: "May reduce primer dimer formation",
            },
          ],
          nextSteps: [
            {
              step: "Test optimized protocol",
              description: "Run side-by-side comparison with current protocol",
            },
            {
              step: "Validate results",
              description: "Ensure optimization doesn't compromise quality",
              dependencies: ["Test optimized protocol"],
            },
          ],
          confidence: 0.85,
          processingTime,
        };

      case AnalysisType.DATA_INTERPRETATION:
        return {
          observations: [
            {
              type: "data_quality",
              description: "Data shows good reproducibility across replicates",
              confidence: 0.91,
            },
            {
              type: "statistical_significance",
              description: "Results are statistically significant (p < 0.05)",
              confidence: 0.94,
            },
          ],
          recommendations: [
            {
              action: "Proceed with publication",
              priority: "HIGH",
              rationale: "Data quality and significance support conclusions",
            },
            {
              action: "Consider additional replicates",
              priority: "LOW",
              rationale: "Would strengthen statistical power",
            },
          ],
          nextSteps: [
            {
              step: "Prepare figures for publication",
              description: "Create publication-quality graphs",
            },
          ],
          confidence: 0.92,
          processingTime,
        };

      default:
        return {
          observations: [
            {
              type: "general_analysis",
              description: "Text analysis completed",
              confidence: 0.75,
            },
          ],
          recommendations: [],
          nextSteps: [],
          confidence: 0.75,
          processingTime,
        };
    }
  }
}
