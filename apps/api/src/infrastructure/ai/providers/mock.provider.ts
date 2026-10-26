import {
  AIProvider,
  ChatMessage,
  ChatResult,
  IAIService,
  IRealtimeAIService,
  ITextToSpeech,
  ImageAnalysisInput,
  ImageAnalysisResult,
  TextAnalysisInput,
  TextAnalysisResult,
} from "../ai-service.interface";

/**
 * Offline provider with canned responses — no API key or network needed.
 * Use for local development and tests: AI_PROVIDER=mock
 */
class MockAIService implements IAIService {
  getServiceName(): string {
    return "Mock AI";
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult> {
    const startTime = Date.now();
    return {
      observations: [
        {
          type: "mock_observation",
          description: `Mock ${input.analysisType} analysis: image looks as expected`,
          confidence: 0.9,
        },
      ],
      recommendations: [
        {
          action: "Proceed with the next protocol step",
          priority: "MEDIUM",
          rationale: "Mock provider always reports a healthy result",
        },
      ],
      nextSteps: [
        { step: "Record results", description: "Save the analysis to the experiment log" },
      ],
      confidence: 0.9,
      processingTime: Date.now() - startTime,
    };
  }

  async analyzeText(input: TextAnalysisInput): Promise<TextAnalysisResult> {
    const startTime = Date.now();
    return {
      observations: [
        {
          type: "mock_observation",
          description: `Mock ${input.analysisType} analysis of a ${input.prompt.length}-character prompt`,
          confidence: 0.8,
        },
      ],
      recommendations: [
        {
          action: "Verify reagents and repeat the step",
          priority: "HIGH",
          rationale: "Mock provider default recommendation",
        },
      ],
      nextSteps: [
        { step: "Re-run experiment", description: "Repeat with fresh reagents" },
      ],
      confidence: 0.8,
      processingTime: Date.now() - startTime,
    };
  }

  async chat(messages: ChatMessage[]): Promise<ChatResult> {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return {
      message: {
        role: "assistant",
        content: `Mock reply to: "${lastUser?.content ?? ""}"`,
      },
    };
  }
}

class MockRealtimeAIService implements IRealtimeAIService {
  private active = false;
  private frameCount = 0;
  private textDeltaCallbacks: Array<(text: string) => void> = [];
  private audioChunkCallbacks: Array<(chunk: Buffer) => void> = [];

  constructor(private tts?: ITextToSpeech) {}

  async startSession(): Promise<void> {
    this.active = true;
    this.frameCount = 0;
  }

  async sendFrame(): Promise<void> {
    if (!this.active) throw new Error("No active session.");
    this.frameCount += 1;

    const text = `Mock guidance for frame ${this.frameCount}: everything looks on track.`;
    this.textDeltaCallbacks.forEach((cb) => cb(text));
    await this.tts?.accumulateAndSpeak(text, (chunk) =>
      this.audioChunkCallbacks.forEach((cb) => cb(chunk)),
    );
  }

  async sendAudioChunk(): Promise<void> {
    if (!this.active) throw new Error("No active session.");
  }

  onTextDelta(callback: (text: string) => void): void {
    this.textDeltaCallbacks.push(callback);
  }

  onAudioChunk(callback: (chunk: Buffer) => void): void {
    this.audioChunkCallbacks.push(callback);
  }

  async interrupt(): Promise<void> {}

  async close(): Promise<void> {
    this.active = false;
    this.tts?.reset();
  }

  isActive(): boolean {
    return this.active;
  }
}

export const mockProvider: AIProvider = {
  name: "mock",
  createAIService: () => new MockAIService(),
  createRealtimeAIService: (tts) => new MockRealtimeAIService(tts),
};
