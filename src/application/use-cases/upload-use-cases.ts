import { Pagination, PaginatedResult, ApiResponse } from "@shared/types";
import { IUploadRepository } from "@domain/repositories";
import { UploadEntity, CreateUploadInput } from "@domain/upload";
import { IStorageAdapter } from "@infrastructure/storage/storage.adapter";

// ─── Key generation ──────────────────────────────────────────────────────────

/**
 * Builds a deterministic, collision-resistant storage key.
 * Format: uploads/{uploaderId}/{uuid}.{ext}
 *
 * Examples:
 *   uploads/abc123/f47ac10b-58cc-4372-a567-0e02b2c3d479.jpg
 *   uploads/abc123/f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf
 */
function buildStorageKey(uploaderId: string, fileName: string): string {
  const ext = fileName.includes(".")
    ? fileName.split(".").pop()!.toLowerCase()
    : "bin";
  return `uploads/${uploaderId}/${crypto.randomUUID()}.${ext}`;
}

// ─── Use Cases ───────────────────────────────────────────────────────────────

export class UploadUseCases {
  constructor(
    private uploadRepository: IUploadRepository,
    private storageAdapter: IStorageAdapter,
  ) {}

  /**
   * Upload a file:
   *  1. Stream the binary to the storage backend (S3 or local disk).
   *  2. Persist the metadata record to the database.
   *  3. Return the full Upload entity including the resolved URL.
   */
  async uploadFile(
    file: File,
    uploaderId: string,
    isPublic = false,
  ): Promise<ApiResponse<UploadEntity>> {
    try {
      if (!file || file.size === 0) {
        return { success: false, error: "No file provided or file is empty" };
      }

      const key = buildStorageKey(uploaderId, file.name);

      // 1 — push bytes to storage
      const { url } = await this.storageAdapter.upload(file, key, file.type);

      // 2 — build + validate the domain entity
      const input: CreateUploadInput = {
        name: file.name,
        url,
        key,
        type: file.type,
        size: file.size,
        uploaderId,
        isPublic,
      };

      const upload = UploadEntity.create(input);

      const validation = upload.validate();
      if (!validation.isValid) {
        // Roll back the storage upload so we don't leave orphaned files
        await this.storageAdapter.delete(key).catch((err) =>
          console.error("[upload-use-cases] Rollback delete failed:", err),
        );
        return { success: false, error: validation.errors.join(", ") };
      }

      // 3 — persist metadata
      await this.uploadRepository.save(upload);

      return {
        success: true,
        data: upload,
        message: "File uploaded successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to upload file",
      };
    }
  }

  /**
   * Retrieve a single upload record by its database ID.
   */
  async getUploadById(id: string): Promise<ApiResponse<UploadEntity>> {
    try {
      const upload = await this.uploadRepository.findById(id);
      if (!upload) {
        return { success: false, error: "Upload not found" };
      }

      return { success: true, data: new UploadEntity(upload) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get upload",
      };
    }
  }

  /**
   * Delete an upload:
   *  1. Remove the file from storage.
   *  2. Remove the metadata record from the database.
   */
  async deleteUpload(id: string): Promise<ApiResponse<void>> {
    try {
      const upload = await this.uploadRepository.findById(id);
      if (!upload) {
        return { success: false, error: "Upload not found" };
      }

      // 1 — remove from storage (best-effort; DB record is the source of truth)
      await this.storageAdapter.delete(upload.key).catch((err) =>
        console.error(
          `[upload-use-cases] Storage delete failed for key "${upload.key}":`,
          err,
        ),
      );

      // 2 — remove metadata
      await this.uploadRepository.delete(id);

      return {
        success: true,
        data: undefined,
        message: "Upload deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete upload",
      };
    }
  }

  /**
   * Make a file publicly accessible.
   * Updates both the storage ACL and the database record.
   */
  async makePublic(id: string): Promise<ApiResponse<UploadEntity>> {
    try {
      const raw = await this.uploadRepository.findById(id);
      if (!raw) {
        return { success: false, error: "Upload not found" };
      }

      const upload = new UploadEntity(raw);

      if (upload.isPublic) {
        return { success: true, data: upload, message: "Already public" };
      }

      // Update storage ACL and get the canonical public URL
      const publicUrl = await this.storageAdapter.makePublic(upload.key);

      upload.makePublic(publicUrl);
      await this.uploadRepository.save(upload);

      return {
        success: true,
        data: upload,
        message: "Upload is now public",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to make upload public",
      };
    }
  }

  /**
   * Restrict a file to private access.
   * Updates both the storage ACL and the database record.
   */
  async makePrivate(id: string): Promise<ApiResponse<UploadEntity>> {
    try {
      const raw = await this.uploadRepository.findById(id);
      if (!raw) {
        return { success: false, error: "Upload not found" };
      }

      const upload = new UploadEntity(raw);

      if (!upload.isPublic) {
        return { success: true, data: upload, message: "Already private" };
      }

      await this.storageAdapter.makePrivate(upload.key);

      upload.makePrivate();
      await this.uploadRepository.save(upload);

      return {
        success: true,
        data: upload,
        message: "Upload is now private",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to make upload private",
      };
    }
  }

  /**
   * List all uploads belonging to the given user.
   */
  async listUserUploads(
    uploaderId: string,
    pagination?: Pagination,
  ): Promise<ApiResponse<PaginatedResult<UploadEntity>>> {
    try {
      const result = await this.uploadRepository.findByUploader(
        uploaderId,
        pagination,
      );

      return {
        success: true,
        data: {
          ...result,
          data: result.data.map((u) => new UploadEntity(u)),
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list user uploads",
      };
    }
  }

  /**
   * List all publicly accessible uploads.
   */
  async listPublicUploads(
    pagination?: Pagination,
  ): Promise<ApiResponse<PaginatedResult<UploadEntity>>> {
    try {
      const result = await this.uploadRepository.findPublic(pagination);

      return {
        success: true,
        data: {
          ...result,
          data: result.data.map((u) => new UploadEntity(u)),
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list public uploads",
      };
    }
  }

  /**
   * Verify that an upload belongs to the given user.
   * Useful in route handlers before permitting mutations.
   */
  async verifyOwnership(
    uploadId: string,
    userId: string,
  ): Promise<ApiResponse<UploadEntity>> {
    try {
      const upload = await this.uploadRepository.findById(uploadId);
      if (!upload) {
        return { success: false, error: "Upload not found" };
      }

      if (upload.uploaderId !== userId) {
        return {
          success: false,
          error: "You do not have permission to modify this upload",
        };
      }

      return { success: true, data: new UploadEntity(upload) };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to verify upload ownership",
      };
    }
  }
}
