/**
 * AI provider factory
 * -------------------
 * The only place that knows which AI backend is in use. Routes and
 * WebSocket handlers ask this factory for an IAIService / IRealtimeAIService
 * and never import a concrete provider.
 *
 * Env vars:
 *   AI_PROVIDER           – "meta" | "mock"   (defaults to "meta")
 *   AI_REALTIME_PROVIDER  – live guidance provider (defaults to AI_PROVIDER)
 *   TTS_PROVIDER          – "elevenlabs" | "none"
 *                           (defaults to "elevenlabs" when ELEVENLABS_API_KEY is set)
 *
 * To add a provider: implement AIProvider in ./providers and add it to
 * `providers` below. See AI_PROVIDERS.md.
 */
import {
  AIProvider,
  IAIService,
  IRealtimeAIService,
  ITextToSpeech,
} from "./ai-service.interface";
import { metaProvider } from "./providers/meta.provider";
import { mockProvider } from "./providers/mock.provider";
import { ElevenLabsTextToSpeech } from "./tts/elevenlabs.tts";

const providers: Record<string, AIProvider> = {
  [metaProvider.name]: metaProvider,
  [mockProvider.name]: mockProvider,
};

const DEFAULT_PROVIDER = metaProvider.name;

function resolveProvider(name: string): AIProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(
      `Unknown AI provider "${name}". Available: ${Object.keys(providers).join(", ")}`,
    );
  }
  return provider;
}

let _aiService: IAIService | null = null;

/**
 * Returns the singleton request/response AI service (chat, analysis).
 */
export function getAIService(): IAIService {
  if (_aiService) return _aiService;

  const name = process.env.AI_PROVIDER ?? DEFAULT_PROVIDER;
  _aiService = resolveProvider(name).createAIService();
  console.log(`[ai] Using "${name}" provider`);
  return _aiService;
}

/**
 * Returns a new realtime service. Not a singleton: each owner keeps its own
 * session state and listeners.
 */
export function createRealtimeAIService(): IRealtimeAIService {
  const name =
    process.env.AI_REALTIME_PROVIDER ?? process.env.AI_PROVIDER ?? DEFAULT_PROVIDER;
  const service = resolveProvider(name).createRealtimeAIService(
    createTextToSpeech(),
  );
  console.log(`[ai] Using "${name}" realtime provider`);
  return service;
}

function createTextToSpeech(): ITextToSpeech | undefined {
  const driver =
    process.env.TTS_PROVIDER ??
    (process.env.ELEVENLABS_API_KEY ? "elevenlabs" : "none");

  switch (driver) {
    case "elevenlabs":
      return new ElevenLabsTextToSpeech();
    case "none":
      return undefined;
    default:
      throw new Error(`Unknown TTS provider "${driver}". Available: elevenlabs, none`);
  }
}

/**
 * Reset the singleton — only useful in tests.
 */
export function resetAIService(): void {
  _aiService = null;
}
