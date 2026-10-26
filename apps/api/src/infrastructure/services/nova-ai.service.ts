import { IRealtimeAIService } from "./ai-service.interface";
import { TTSService } from "./tts.service";

export class NovaAIService implements IRealtimeAIService {
  private apiKey: string;
  private apiUrl = "https://api.nova.amazon.com/v1/chat/completions";
  private model = "nova-pro-v1"; // or nova-2-pro-v1 for vision
  private sessionActive = false;
  private systemPrompt = "";
  private conversationHistory: Array<{ role: "user" | "assistant"; content: any }> = [];
  private textDeltaCallbacks: Array<(text: string) => void> = [];
  private audioChunkCallbacks: Array<(chunk: Buffer) => void> = [];
  private isStreaming = false;
  private aborted = false;
  private textBuffer = "";
  private ttsService: TTSService;

  constructor(region: string = "us-east-1") {
    this.apiKey = process.env.AMAZON_NOVA_API_KEY!;
    if (!this.apiKey) throw new Error("AMAZON_NOVA_API_KEY is not set");
    this.ttsService = new TTSService();
  }

  async startSession(config: { systemPrompt: string; temperature?: number; maxTokens?: number }): Promise<void> {
    if (this.sessionActive) await this.close();
    this.systemPrompt = config.systemPrompt;
    this.conversationHistory = [];
    this.textBuffer = "";
    this.aborted = false;
    this.isStreaming = false;
    this.sessionActive = true;
    console.log(`[Nova] Session started: "${config.systemPrompt.substring(0, 50)}..."`);
  }

  async sendFrame(frameBase64: string, mimeType: string = "image/jpeg"): Promise<void> {
    if (!this.sessionActive) throw new Error("No active session.");
    if (this.isStreaming) {
      console.warn("[Nova] Already streaming, dropping frame");
      return;
    }

    const userMessage = {
      role: "user" as const,
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${frameBase64}`,
          },
        },
        {
          type: "text",
          text: "Analyze this lab experiment frame and provide real-time guidance.",
        },
      ],
    };

    await this.streamResponse(userMessage);
  }

  async sendAudioChunk(audioBase64: string): Promise<void> {
    if (!this.sessionActive) throw new Error("No active session.");
    if (this.isStreaming) {
      console.warn("[Nova] Already streaming, dropping audio");
      return;
    }
    // Nova API doesn't support audio input yet — send as text note
    await this.streamResponse({
      role: "user",
      content: "User sent audio input.",
    });
  }

  private async streamResponse(userMessage: { role: "user"; content: any }): Promise<void> {
    this.isStreaming = true;
    this.textBuffer = "";

    const messages = [
      { role: "system", content: this.systemPrompt },
      ...this.conversationHistory,
      userMessage,
    ];

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: 512,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Nova API error ${response.status}: ${error}`);
      }

      // Read SSE stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        if (this.aborted) break;

        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.trim());

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) {
              this.textBuffer += text;
              this.textDeltaCallbacks.forEach((cb) => cb(text));
            }
          } catch {}
        }
      }

      // Save to history
      if (this.textBuffer) {
        this.conversationHistory.push(userMessage);
        this.conversationHistory.push({
          role: "assistant",
          content: this.textBuffer,
        });

        // Cap history at 10 turns
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }
      }
    } catch (error) {
      if (!this.aborted) {
        console.error("[Nova] Stream error:", error);
        throw error;
      }
    } finally {
      this.isStreaming = false;
    }
  }

 onTextDelta(callback: (text: string) => void): void {
  this.textDeltaCallbacks.push(callback);

  // ✅ Also convert text deltas to audio
  this.textDeltaCallbacks.push(async (text: string) => {
    await this.ttsService.accumulateAndSpeak(text, (audioChunk) => {
      this.audioChunkCallbacks.forEach((cb) => cb(audioChunk));
    });
  });
}


  onAudioChunk(callback: (chunk: Buffer) => void): void {
    this.audioChunkCallbacks.push(callback);
  }

  async interrupt(): Promise<void> {
    this.aborted = true;
    console.log("[Nova] Interrupted");
  }

  async close(): Promise<void> {
    this.sessionActive = false;
    this.isStreaming = false;
    this.aborted = false;
    this.conversationHistory = [];
    this.textBuffer = "";
    this.textDeltaCallbacks = [];
    this.audioChunkCallbacks = [];
    console.log("[Nova] Session closed");
  }

  isActive(): boolean {
    return this.sessionActive;
  }

  onError(callback: (error: Error) => void): void {}
}