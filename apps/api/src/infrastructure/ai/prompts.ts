// Provider-agnostic prompts and response parsing for lab analysis.
// Every adapter uses these so switching providers never changes behaviour.

import { AnalysisType } from "@domain/analysis";
import { ImageAnalysisInput, ImageAnalysisResult } from "./ai-service.interface";

export const IMAGE_ANALYSIS_SYSTEM_PROMPT = `You are an expert laboratory scientist specializing in image analysis. \
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
Return ONLY the raw JSON object. Do not wrap it in markdown code fences or include any other text.`;

export const TEXT_ANALYSIS_SYSTEM_PROMPT = `You are an expert laboratory scientist. \
Answer strictly with the raw JSON object requested by the user. Do not wrap it in markdown code fences or include any other text.`;

export const LIVE_FRAME_PROMPT =
  "Analyze this lab experiment frame and provide real-time guidance.";

// JSON Schema for providers that support structured output
// (response_format: { type: "json_schema" }).
export const ANALYSIS_RESULT_SCHEMA = {
  type: "object",
  properties: {
    observations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          description: { type: "string" },
          confidence: { type: "number" },
          location: { type: "string" },
        },
        required: ["type", "description"],
      },
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          action: { type: "string" },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          rationale: { type: "string" },
          estimatedTime: { type: "string" },
          resources: { type: "array", items: { type: "string" } },
        },
        required: ["action", "priority"],
      },
    },
    next_steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          step: { type: "string" },
          description: { type: "string" },
          dependencies: { type: "array", items: { type: "string" } },
        },
        required: ["step", "description"],
      },
    },
    confidence: { type: "number" },
  },
  required: ["observations", "recommendations", "next_steps", "confidence"],
} as const;

export function buildImageAnalysisPrompt(input: ImageAnalysisInput): string {
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

/**
 * Parse a model's JSON answer into the shared analysis result shape.
 * Tolerates markdown code fences for models without structured output.
 */
export function parseAnalysisResult(
  raw: string,
  startTime: number,
): ImageAnalysisResult {
  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    observations: parsed.observations ?? [],
    recommendations: parsed.recommendations ?? [],
    nextSteps: parsed.next_steps ?? parsed.nextSteps ?? [],
    confidence: parsed.confidence,
    processingTime: Date.now() - startTime,
  };
}
