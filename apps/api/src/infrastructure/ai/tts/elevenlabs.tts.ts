// src/infrastructure/ai/tts/elevenlabs.tts.ts
import { ElevenLabsClient } from "elevenlabs";
import { ITextToSpeech } from "../ai-service.interface";

/**
 * ElevenLabsTextToSpeech
 * ----------------------
 * Required env vars:
 *   ELEVENLABS_API_KEY
 *
 * Optional:
 *   ELEVENLABS_VOICE_ID – defaults to "George" (clear, professional)
 */
export class ElevenLabsTextToSpeech implements ITextToSpeech {
  private client: ElevenLabsClient;
  private voiceId: string;
  private buffer = "";

  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set");

    this.client = new ElevenLabsClient({ apiKey });
    this.voiceId = process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";
  }

  // Accumulate text deltas and flush when sentence is complete
  async accumulateAndSpeak(
    textDelta: string,
    onAudioChunk: (chunk: Buffer) => void
  ): Promise<void> {
    this.buffer += textDelta;

    // Flush on sentence boundaries
    const sentenceEnd = /[.!?]\s*$/.test(this.buffer);
    const longEnough = this.buffer.length > 80;

    if (sentenceEnd || longEnough) {
      await this.flush(onAudioChunk);
    }
  }

  private async flush(onAudioChunk: (chunk: Buffer) => void): Promise<void> {
    const text = this.buffer.trim();
    this.buffer = "";

    if (!text) return;

    try {
      const audio = await this.client.textToSpeech.convert(this.voiceId, {
        text,
        model_id: "eleven_turbo_v2", // lowest latency
        output_format: "mp3_44100_128",
      });

      const chunks: Buffer[] = [];
      for await (const chunk of audio) {
        chunks.push(Buffer.from(chunk));
      }

      onAudioChunk(Buffer.concat(chunks));
    } catch (err) {
      console.error("[TTS] Error:", err);
    }
  }

  reset(): void {
    this.buffer = "";
  }
}
