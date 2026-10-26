import OpenAI from "openai";
import { IRealtimeAIService, ITextToSpeech } from "../ai-service.interface";
import { LIVE_FRAME_PROMPT } from "../prompts";
import {
  OpenAICompatibleConfig,
  createLazyClient,
} from "./openai-compatible.service";

type SessionConfig = Parameters<IRealtimeAIService["startSession"]>[0];

// Keep the last 10 exchanges (user + assistant) as context
const MAX_HISTORY_MESSAGES = 20;

/**
 * Live experiment guidance over streaming Chat Completions.
 * Each camera frame is one streamed request; text deltas are forwarded to
 * listeners and, when a TTS adapter is supplied, converted to audio.
 */
export class OpenAICompatibleRealtimeService implements IRealtimeAIService {
  private client: () => OpenAI;
  private session: SessionConfig | null = null;
  private history: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  private textDeltaCallbacks: Array<(text: string) => void> = [];
  private audioChunkCallbacks: Array<(chunk: Buffer) => void> = [];
  private abortController: AbortController | null = null;

  constructor(
    private config: OpenAICompatibleConfig,
    private tts?: ITextToSpeech,
  ) {
    this.client = createLazyClient(config);
  }

  private get logPrefix(): string {
    return `[${this.config.serviceName}]`;
  }

  async startSession(config: SessionConfig): Promise<void> {
    if (this.session) await this.close();
    this.client(); // fail fast when the provider is not configured
    this.session = config;
    console.log(
      `${this.logPrefix} Session started: "${config.systemPrompt.substring(0, 50)}..."`,
    );
  }

  async sendFrame(frameBase64: string, mimeType: string = "image/jpeg"): Promise<void> {
    if (!this.session) throw new Error("No active session.");
    if (this.abortController) {
      console.warn(`${this.logPrefix} Already streaming, dropping frame`);
      return;
    }

    await this.streamResponse([
      { type: "image_url", image_url: { url: `data:${mimeType};base64,${frameBase64}` } },
      { type: "text", text: LIVE_FRAME_PROMPT },
    ]);
  }

  async sendAudioChunk(_audioBase64: string): Promise<void> {
    if (!this.session) throw new Error("No active session.");
    // Audio input is not wired up yet: the mobile client does not send it,
    // and Meta's transcription API only accepts 16-bit PCM WAV.
    console.warn(`${this.logPrefix} Audio input not supported yet, dropping chunk`);
  }

  private async streamResponse(
    content: OpenAI.Chat.ChatCompletionContentPart[],
  ): Promise<void> {
    const session = this.session!;
    const controller = new AbortController();
    this.abortController = controller;
    let reply = "";

    try {
      const stream = await this.client().chat.completions.create(
        {
          model: this.config.models.realtime,
          messages: [
            { role: "system", content: session.systemPrompt },
            ...this.history,
            { role: "user", content },
          ],
          temperature: session.temperature,
          max_completion_tokens: session.maxTokens,
          stream: true,
        },
        { signal: controller.signal },
      );

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (!text) continue;
        reply += text;
        this.emitText(text);
      }

      if (reply) {
        // Store frames as a text marker so history doesn't resend every image
        this.history.push(
          { role: "user", content: "[camera frame]" },
          { role: "assistant", content: reply },
        );
        this.history = this.history.slice(-MAX_HISTORY_MESSAGES);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error(`${this.logPrefix} Stream error:`, error);
        throw error;
      }
    } finally {
      if (this.abortController === controller) this.abortController = null;
    }
  }

  private emitText(text: string): void {
    this.textDeltaCallbacks.forEach((cb) => cb(text));

    this.tts
      ?.accumulateAndSpeak(text, (audioChunk) => {
        this.audioChunkCallbacks.forEach((cb) => cb(audioChunk));
      })
      .catch((err) => console.error(`${this.logPrefix} TTS error:`, err));
  }

  onTextDelta(callback: (text: string) => void): void {
    this.textDeltaCallbacks.push(callback);
  }

  onAudioChunk(callback: (chunk: Buffer) => void): void {
    this.audioChunkCallbacks.push(callback);
  }

  async interrupt(): Promise<void> {
    this.abortController?.abort();
    this.tts?.reset();
    console.log(`${this.logPrefix} Interrupted`);
  }

  async close(): Promise<void> {
    this.abortController?.abort();
    this.abortController = null;
    this.session = null;
    this.history = [];
    this.tts?.reset();
    // Listeners are registered once by the owner and survive across sessions
    console.log(`${this.logPrefix} Session closed`);
  }

  isActive(): boolean {
    return this.session !== null;
  }
}
