// src/infrastructure/services/tts.service.ts
import { ElevenLabsClient } from "elevenlabs";

export class TTSService {
  private client: ElevenLabsClient;
  private voiceId = "JBFqnCBsd6RMkjVDRZzb"; // "George" — clear, professional
  private buffer = "";
  private flushTimer: any = null;

  constructor() {
    this.client = new ElevenLabsClient({
      apiKey: 'sk_1a3ab9e27d274748b13878037ba91fc740b6e41ab160918d',
    });
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