import { ISpeechToText } from "../ai-service.interface";
import { convertToWav } from "../audio/to-wav";

/**
 * MetaSpeechToText
 * ----------------
 * File transcription with Meta's muse-voice-transcribe-1.0
 * (POST https://api.meta.ai/v1/asr/transcribe). The API only accepts mono
 * 16-bit PCM WAV, so every clip is converted with ffmpeg first.
 *
 * Required env vars:
 *   MODEL_API_KEY
 *
 * Optional:
 *   META_BASE_URL – defaults to "https://api.meta.ai/v1"
 *   META_STT_MODEL – defaults to "muse-voice-transcribe-1.0"
 */
export class MetaSpeechToText implements ISpeechToText {
  private baseURL = process.env.META_BASE_URL ?? "https://api.meta.ai/v1";
  private model = process.env.META_STT_MODEL ?? "muse-voice-transcribe-1.0";

  async transcribe(audio: Blob): Promise<{ text: string }> {
    const apiKey = process.env.MODEL_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Meta speech-to-text is not configured. Please set MODEL_API_KEY in environment variables.",
      );
    }

    const wav = await convertToWav(audio, 16000);

    const { body, contentType } = await buildMultipart(
      JSON.stringify({ model: this.model, audioEncoding: "WAV", mode: "PUSH_TO_TALK" }),
      wav,
    );

    const response = await fetch(`${this.baseURL}/asr/transcribe`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": contentType,
      },
      body,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message = (body as any)?.error?.message ?? (body as any)?.message;
      throw new Error(
        `Meta transcription failed (${response.status})${message ? `: ${message}` : ""}`,
      );
    }

    const data = (await response.json()) as { transcript?: string };
    return { text: data.transcript?.trim() ?? "" };
  }
}

/**
 * Hand-built multipart body matching Meta's documented request
 * (curl -F 'request=…;type=application/json' -F 'audio=@x.wav;type=audio/wav').
 * FormData would give the JSON part a filename and a charset, which the
 * docs don't show.
 */
async function buildMultipart(
  requestJson: string,
  wav: Blob,
): Promise<{ body: Blob; contentType: string }> {
  const boundary = `----lab-assistant-${crypto.randomUUID()}`;
  const body = new Blob([
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="request"\r\n`,
    `Content-Type: application/json\r\n\r\n`,
    requestJson,
    `\r\n--${boundary}\r\n`,
    `Content-Disposition: form-data; name="audio"; filename="recording.wav"\r\n`,
    `Content-Type: audio/wav\r\n\r\n`,
    await wav.arrayBuffer(),
    `\r\n--${boundary}--\r\n`,
  ]);
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}
