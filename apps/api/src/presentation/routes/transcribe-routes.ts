import { Hono } from "hono";
import { getSpeechToText } from "@infrastructure/ai/ai-provider.factory";
import { authMiddleware, AuthContext } from "@shared/middleware";

// Clips are converted to 16 kHz mono WAV before transcription; Meta caps the
// converted request at 32 MB / 10 minutes, so reject oversized uploads early.
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export const transcribeRoutes = new Hono();

const protectedRoutes = new Hono();
protectedRoutes.use("*", authMiddleware);

// ---------------------------------------------------------------------------
// POST /
// Transcribe a recorded voice clip via multipart/form-data.
//
// Form fields:
//   audio  (required) – the recording (m4a, aac, webm, 3gp, wav, …)
//
// Response 200:
//   { success: true, data: { text } }
// ---------------------------------------------------------------------------
protectedRoutes.post("/", async (c: AuthContext) => {
  let body: Record<string, string | File>;
  try {
    body = (await c.req.parseBody()) as Record<string, string | File>;
  } catch {
    return c.json({ error: "Failed to parse multipart body" }, 400);
  }

  const audio = body["audio"];
  if (!audio || typeof audio === "string") {
    return c.json(
      { error: 'Missing required form field "audio" (must be a file)' },
      400,
    );
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return c.json({ error: "Audio file is too large (max 25 MB)" }, 413);
  }

  try {
    const result = await getSpeechToText().transcribe(audio);
    return c.json({ success: true, data: { text: result.text } });
  } catch (error) {
    console.error("Transcription error:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Transcription failed",
      },
      500,
    );
  }
});

transcribeRoutes.route("/", protectedRoutes);
