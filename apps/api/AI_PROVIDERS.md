# AI providers

All AI calls go through a provider adapter, so you can switch the model backend with an environment variable and no code changes. The app currently ships with these providers:

| Provider | `AI_PROVIDER` value | Notes |
|---|---|---|
| Meta Model API (Muse) | `meta` (default) | Uses `muse-spark-1.3` by default. Docs: https://dev.meta.ai/docs |
| Mock | `mock` | Returns canned responses. Needs no network or API key. |

Text-to-speech for live guidance is a separate adapter, because Meta's API has no speech output:

| TTS | `TTS_PROVIDER` value |
|---|---|
| ElevenLabs | `elevenlabs` (the default when `ELEVENLABS_API_KEY` is set) |
| Off | `none` |

## Configuration

```bash
AI_PROVIDER=meta              # meta | mock
# AI_REALTIME_PROVIDER=mock   # optional: use a different provider for live guidance
MODEL_API_KEY=...             # Meta Model API key

# Optional Meta overrides
# META_MODEL=muse-spark-1.3   # default model for every task
# META_TEXT_MODEL=            # chat, troubleshooting, protocol optimization
# META_VISION_MODEL=          # lab image analysis
# META_REALTIME_MODEL=        # live experiment guidance
# META_BASE_URL=https://api.meta.ai/v1

ELEVENLABS_API_KEY=...
# ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
```

The server starts even if `MODEL_API_KEY` is missing. Only the AI requests fail, with an error that names the missing variable. For local work without a key, set `AI_PROVIDER=mock`.

## How it fits together

```
routes / WebSocket handler
        │  getAIService() / createRealtimeAIService()
        ▼
ai-provider.factory.ts ── reads AI_PROVIDER, AI_REALTIME_PROVIDER, TTS_PROVIDER
        │
        ├── providers/meta.provider.ts ──► OpenAICompatibleAIService
        │                                  OpenAICompatibleRealtimeService
        ├── providers/mock.provider.ts
        └── tts/elevenlabs.tts.ts
```

Everything lives in `src/infrastructure/ai/`:

| File | Purpose |
|---|---|
| `ai-service.interface.ts` | The contracts: `IAIService` (chat and analysis), `IRealtimeAIService` (live guidance), `ITextToSpeech`, and `AIProvider`. |
| `ai-provider.factory.ts` | The provider registry. This is the only file that knows which providers exist. |
| `prompts.ts` | Lab prompts, the JSON schema for analysis results, and the response parser. Every provider shares them. |
| `providers/openai-compatible.*.ts` | A reusable adapter for any API that speaks the OpenAI Chat Completions format. |

Use cases depend only on the interfaces, so they never change when you switch providers.

## Adding a provider

**OpenAI-compatible API** (OpenAI, Amazon Nova, Groq, Together, or a local vLLM or Ollama server). Copy `providers/meta.provider.ts` and change the config:

```ts
export const openaiProvider: AIProvider = {
  name: "openai",
  createAIService: () => new OpenAICompatibleAIService(loadConfig()),
  createRealtimeAIService: (tts) => new OpenAICompatibleRealtimeService(loadConfig(), tts),
};

function loadConfig(): OpenAICompatibleConfig {
  return {
    serviceName: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    apiKeyEnvVar: "OPENAI_API_KEY",
    models: { text: "gpt-4.1", vision: "gpt-4.1", realtime: "gpt-4.1-mini" },
    supportsJsonSchema: true, // false makes the adapter rely on the prompt alone for JSON
  };
}
```

Then register it in `ai-provider.factory.ts`:

```ts
const providers: Record<string, AIProvider> = {
  [metaProvider.name]: metaProvider,
  [mockProvider.name]: mockProvider,
  [openaiProvider.name]: openaiProvider,
};
```

**Any other API.** Implement `IAIService` and `IRealtimeAIService` yourself, using `mock.provider.ts` as the template. Then register the provider the same way.

**Removing a provider.** Delete its file and its line in `providers`.

## Known limitations

- **Audio input.** `sendAudioChunk` logs a warning and drops the chunk. The mobile app doesn't send audio yet. Meta's speech-to-text API (`muse-voice-transcribe-1.0`) only accepts 16-bit PCM WAV, so the app would need to convert its recordings before a transcription adapter could use them.
- **One shared live session per handler.** Each realtime service holds one session. The WebSocket handler is a single shared instance, so two users running live guidance at the same time share a session. This was already the case before the adapter refactor.
