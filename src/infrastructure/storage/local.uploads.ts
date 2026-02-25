import { IStorageAdapter } from "./storage.adapter";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";

const UPLOADS_DIR = join(process.cwd(), "uploads");

// Ensure the uploads directory exists on startup
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * LocalStorageAdapter
 * -------------------
 * Stores files on the local filesystem under <project-root>/uploads/.
 * Useful for quick local development — no cloud credentials needed.
 *
 * Files are served at: http://localhost:<PORT>/uploads/<key>
 * The Hono local dev server registers a static route for /uploads.
 */
export class LocalStorageAdapter implements IStorageAdapter {
  private baseUrl(): string {
    const port = process.env.PORT ?? "3000";
    return `http://localhost:${port}/uploads`;
  }

  async upload(
    file: Blob | File,
    key: string,
    _mimeType: string,
  ): Promise<{ url: string; key: string }> {
    const filePath = join(UPLOADS_DIR, key);

    // Ensure any sub-directories exist (e.g. "userId/abc123.jpg")
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const url = `${this.baseUrl()}/${key}`;
    console.log(`[local-storage] Uploaded: ${filePath}`);
    return { url, key };
  }

  async delete(key: string): Promise<void> {
    const filePath = join(UPLOADS_DIR, key);

    if (existsSync(filePath)) {
      unlinkSync(filePath);
      console.log(`[local-storage] Deleted: ${filePath}`);
    } else {
      console.warn(`[local-storage] File not found for deletion: ${filePath}`);
    }
  }

  async makePublic(key: string): Promise<string> {
    // Local files are always accessible via the static route — nothing to change.
    console.warn("[local-storage] makePublic is a no-op for local storage");
    return `${this.baseUrl()}/${key}`;
  }

  async makePrivate(_key: string): Promise<void> {
    // Local files are always accessible via the static route — nothing to change.
    console.warn("[local-storage] makePrivate is a no-op for local storage");
  }
}
