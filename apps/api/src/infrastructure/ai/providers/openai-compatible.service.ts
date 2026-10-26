import OpenAI from "openai";
import {
  IAIService,
  ImageAnalysisInput,
  ImageAnalysisResult,
  TextAnalysisInput,
  TextAnalysisResult,
  ChatMessage,
  ChatResult,
} from "../ai-service.interface";
import {
  ANALYSIS_RESULT_SCHEMA,
  IMAGE_ANALYSIS_SYSTEM_PROMPT,
  TEXT_ANALYSIS_SYSTEM_PROMPT,
  buildImageAnalysisPrompt,
  parseAnalysisResult,
} from "../prompts";

/**
 * Everything that differs between OpenAI-compatible providers.
 * A new provider (OpenAI, Groq, a local vLLM, …) is just another config.
 */
export interface OpenAICompatibleConfig {
  serviceName: string;
  baseURL: string;
  apiKey?: string;
  // Env var holding the key, used in "not configured" errors
  apiKeyEnvVar: string;
  models: {
    text: string; // chat, troubleshooting, protocol optimization
    vision: string; // lab image analysis
    realtime: string; // live experiment guidance
  };
  // Provider honours response_format: { type: "json_schema" }
  supportsJsonSchema: boolean;
}

/**
 * Creates the SDK client on first use, so a missing key only fails
 * the request that needs it instead of crashing the server on boot.
 */
export function createLazyClient(
  config: OpenAICompatibleConfig,
): () => OpenAI {
  let client: OpenAI | null = null;
  return () => {
    if (!config.apiKey) {
      throw new Error(
        `${config.serviceName} is not configured. Please set ${config.apiKeyEnvVar} in environment variables.`,
      );
    }
    client ??= new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
    return client;
  };
}

export class OpenAICompatibleAIService implements IAIService {
  private client: () => OpenAI;

  constructor(private config: OpenAICompatibleConfig) {
    this.client = createLazyClient(config);
  }

  getServiceName(): string {
    return this.config.serviceName;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client().models.list();
      return true;
    } catch (error) {
      console.error(`${this.config.serviceName} unavailable:`, error);
      return false;
    }
  }

  async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult> {
    const startTime = Date.now();

    try {
      const raw = await this.completeJson(this.config.models.vision, [
        { role: "system", content: IMAGE_ANALYSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: buildImageAnalysisPrompt(input) },
            { type: "image_url", image_url: { url: input.imageUrl } },
          ],
        },
      ]);
      return parseAnalysisResult(raw, startTime);
    } catch (error) {
      console.error(`${this.config.serviceName} image analysis error:`, error);
      throw new Error(
        `Failed to analyze image: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async analyzeText(input: TextAnalysisInput): Promise<TextAnalysisResult> {
    const startTime = Date.now();

    try {
      // input.context is already embedded in the prompt by the use cases
      const raw = await this.completeJson(this.config.models.text, [
        { role: "system", content: TEXT_ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: input.prompt },
      ]);
      return parseAnalysisResult(raw, startTime);
    } catch (error) {
      console.error(`${this.config.serviceName} text analysis error:`, error);
      throw new Error(
        `Failed to analyze text: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async chat(messages: ChatMessage[]): Promise<ChatResult> {
    try {
      const completion = await this.client().chat.completions.create({
        model: this.config.models.text,
        messages,
      });

      const content = completion.choices[0]?.message?.content;
      if (typeof content !== "string") {
        throw new Error("Invalid response from AI chat service");
      }

      return { message: { role: "assistant", content } };
    } catch (error) {
      console.error(`${this.config.serviceName} chat error:`, error);
      throw new Error(
        `Failed to chat with AI service: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async completeJson(
    model: string,
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
  ): Promise<string> {
    const completion = await this.client().chat.completions.create({
      model,
      messages,
      ...(this.config.supportsJsonSchema && {
        response_format: {
          type: "json_schema",
          json_schema: { name: "lab_analysis", schema: ANALYSIS_RESULT_SCHEMA },
        },
      }),
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from AI service");
    return content;
  }
}
