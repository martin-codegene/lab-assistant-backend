/**
 * IStorageAdapter
 * ---------------
 * Every storage backend (local, AWS S3, GCS, …) must implement this interface.
 * Swap the active adapter by setting STORAGE_DRIVER in your .env file.
 *
 * Supported values: "local" | "aws"  (defaults to "local")
 */
export interface IStorageAdapter {
  /**
   * Upload a file and return its URL and the storage key.
   * @param file     - The raw file data (Blob / File)
   * @param key      - Unique storage key / path (e.g. "uploads/userId/uuid.jpg")
   * @param mimeType - MIME type of the file (e.g. "image/jpeg")
   */
  upload(
    file: Blob | File,
    key: string,
    mimeType: string,
  ): Promise<{ url: string; key: string }>;

  /**
   * Permanently delete a file by its storage key.
   */
  delete(key: string): Promise<void>;

  /**
   * Make a file publicly accessible and return its new public URL.
   */
  makePublic(key: string): Promise<string>;

  /**
   * Restrict a file to private access.
   */
  makePrivate(key: string): Promise<void>;
}

// ─── Factory ────────────────────────────────────────────────────────────────

type StorageDriver = "local" | "aws";

let _instance: IStorageAdapter | null = null;

/**
 * Returns a singleton storage adapter based on the STORAGE_DRIVER env var.
 * Defaults to "local" when the variable is not set.
 *
 * Lazy-loads the concrete implementation so neither the AWS SDK nor the
 * filesystem module is required unless that driver is actually selected.
 */
export async function getStorageAdapter(): Promise<IStorageAdapter> {
  if (_instance) return _instance;

  const driver = (process.env.STORAGE_DRIVER ?? "local") as StorageDriver;

  if (driver === "aws") {
    const { AwsStorageAdapter } = await import("./aws.uploads.js");
    _instance = new AwsStorageAdapter();
  } else {
    const { LocalStorageAdapter } = await import("./local.uploads.js");
    _instance = new LocalStorageAdapter();
  }

  console.log(`[storage] Using "${driver}" adapter`);
  return _instance as IStorageAdapter;
}

/**
 * Reset the singleton — only useful in tests.
 */
export function resetStorageAdapter(): void {
  _instance = null;
}
