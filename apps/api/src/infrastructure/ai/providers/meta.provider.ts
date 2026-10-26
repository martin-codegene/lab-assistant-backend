import { AIProvider } from "../ai-service.interface";
import {
  OpenAICompatibleAIService,
  OpenAICompatibleConfig,
} from "./openai-compatible.service";
import { OpenAICompatibleRealtimeService } from "./openai-compatible.realtime";

/**
 * Meta Model API (Muse models) — https://dev.meta.ai/docs
 * OpenAI-compatible, so it runs on the shared OpenAI-compatible adapter.
 *
 * Required env vars:
 *   MODEL_API_KEY
 *
 * Optional:
 *   META_BASE_URL       – defaults to "https://api.meta.ai/v1"
 *   META_MODEL          – default for all tasks, "muse-spark-1.3"
 *   META_TEXT_MODEL     – override for chat / text analysis
 *   META_VISION_MODEL   – override for image analysis
 *   META_REALTIME_MODEL – override for live experiment guidance
 */
function loadMetaConfig(): OpenAICompatibleConfig {
  const defaultModel = process.env.META_MODEL ?? "muse-spark-1.3";

  return {
    serviceName: "Meta Muse",
    baseURL: process.env.META_BASE_URL ?? "https://api.meta.ai/v1",
    apiKey: process.env.MODEL_API_KEY,
    apiKeyEnvVar: "MODEL_API_KEY",
    models: {
      text: process.env.META_TEXT_MODEL ?? defaultModel,
      vision: process.env.META_VISION_MODEL ?? defaultModel,
      realtime: process.env.META_REALTIME_MODEL ?? defaultModel,
    },
    supportsJsonSchema: true,
  };
}

export const metaProvider: AIProvider = {
  name: "meta",
  createAIService: () => new OpenAICompatibleAIService(loadMetaConfig()),
  createRealtimeAIService: (tts) =>
    new OpenAICompatibleRealtimeService(loadMetaConfig(), tts),
};
