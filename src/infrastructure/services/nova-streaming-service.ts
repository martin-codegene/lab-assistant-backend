// infrastructure/ai/NovaStreamingService.ts
import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

export class NovaStreamingService {
  private client = new BedrockRuntimeClient({ region: "us-east-1" });

  async streamExperimentGuidance(inputBufferStream: any) {
    const command = new ConverseStreamCommand({
      modelId: "amazon.nova-2-sonic-v1:0", // Use Sonic for real-time speech/vision
      messages: [
        {
          role: "user",
          content: [
            { video: { format: "mkv", source: { bytes: inputBufferStream } } },
          ],
        },
      ],
      system: [{ text: "You are a lab assistant. Watch the experiment..." }],
    });

    const response = await this.client.send(command);
    return response.stream; // This is an Async Iterable
  }
}
