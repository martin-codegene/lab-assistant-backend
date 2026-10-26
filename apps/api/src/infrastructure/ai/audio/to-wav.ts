import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Convert any audio clip ffmpeg understands (m4a, aac, webm, 3gp, wav, …)
 * into mono 16-bit PCM WAV at the given sample rate.
 *
 * Uses temp files rather than pipes: m4a keeps its index at the end of the
 * file, so ffmpeg can't read it from a stream, and a WAV written to a pipe
 * has no valid length header.
 *
 * Requires the `ffmpeg` binary on PATH (set FFMPEG_PATH to override).
 */
export async function convertToWav(
  audio: Blob,
  sampleRate: 16000 | 24000 = 16000,
): Promise<Blob> {
  const dir = await mkdtemp(join(tmpdir(), "lab-audio-"));
  const input = join(dir, "input");
  const output = join(dir, "output.wav");

  try {
    await writeFile(input, Buffer.from(await audio.arrayBuffer()));
    await runFfmpeg([
      "-hide_banner",
      "-loglevel", "error",
      "-i", input,
      "-ac", "1",
      "-ar", String(sampleRate),
      "-sample_fmt", "s16",
      "-f", "wav",
      output,
    ]);
    return new Blob([await readFile(output)], { type: "audio/wav" });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.env.FFMPEG_PATH ?? "ffmpeg", args);
    let stderr = "";

    proc.stderr.on("data", (chunk) => (stderr += chunk));
    proc.on("error", (err) =>
      reject(new Error(`Could not run ffmpeg (is it installed?): ${err.message}`)),
    );
    proc.on("close", (code) => {
      if (code === 0) return resolve();
      // ffmpeg output includes temp paths; keep it in the server log only
      console.error(`[audio] ffmpeg exited with ${code}: ${stderr.trim()}`);
      reject(new Error("Audio conversion failed: unsupported or corrupt audio file"));
    });
  });
}
