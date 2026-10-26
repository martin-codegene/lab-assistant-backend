import { BaseEntity } from "@shared/types";
import { User } from "./user";

export interface Upload extends BaseEntity {
  name: string;        // original file name
  url: string;         // public/private URL returned by the adapter
  key: string;         // storage key (e.g. "uploads/userId/uuid.jpg")
  type: string;        // MIME type (e.g. "image/jpeg")
  size: number;        // file size in bytes
  uploaderId: string;
  isPublic: boolean;

  // Relations (populated when fetched)
  uploader?: User;
}

export interface CreateUploadInput {
  name: string;
  url: string;
  key: string;
  type: string;
  size: number;
  uploaderId: string;
  isPublic?: boolean;
}

export interface UpdateUploadInput {
  url?: string;
  isPublic?: boolean;
}

export class UploadEntity implements Upload {
  id: string;
  name: string;
  url: string;
  key: string;
  type: string;
  size: number;
  uploaderId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  uploader?: User;

  constructor(data: Upload) {
    this.id = data.id;
    this.name = data.name;
    this.url = data.url;
    this.key = data.key;
    this.type = data.type;
    this.size = data.size;
    this.uploaderId = data.uploaderId;
    this.isPublic = data.isPublic;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.uploader = data.uploader;
  }

  static create(input: CreateUploadInput): UploadEntity {
    const now = new Date();
    return new UploadEntity({
      id: crypto.randomUUID(),
      name: input.name,
      url: input.url,
      key: input.key,
      type: input.type,
      size: input.size,
      uploaderId: input.uploaderId,
      isPublic: input.isPublic ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }

  // --- Business logic ---

  /**
   * Mark this record as publicly accessible.
   * The caller is responsible for also updating the storage backend ACL.
   */
  makePublic(newUrl: string): void {
    this.isPublic = true;
    this.url = newUrl;
    this.updatedAt = new Date();
  }

  /**
   * Restrict this record to private access.
   * The caller is responsible for also updating the storage backend ACL.
   */
  makePrivate(): void {
    this.isPublic = false;
    this.updatedAt = new Date();
  }

  /** Human-readable file size (e.g. "1.2 MB", "340 KB"). */
  get fileSizeFormatted(): string {
    const bytes = this.size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  /** File extension derived from the original name, lower-cased (without the dot). */
  get fileExtension(): string {
    const parts = this.name.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  }

  isImage(): boolean {
    return this.type.startsWith("image/");
  }

  isVideo(): boolean {
    return this.type.startsWith("video/");
  }

  isAudio(): boolean {
    return this.type.startsWith("audio/");
  }

  isDocument(): boolean {
    return (
      this.type === "application/pdf" ||
      this.type.startsWith("application/msword") ||
      this.type.startsWith(
        "application/vnd.openxmlformats-officedocument"
      ) ||
      this.type === "text/plain" ||
      this.type === "text/csv"
    );
  }

  isDataFile(): boolean {
    return (
      this.type === "application/json" ||
      this.type === "text/csv" ||
      this.type === "application/xml" ||
      this.type === "text/xml" ||
      this.type === "application/octet-stream"
    );
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push("File name is required");
    }

    if (this.name && this.name.length > 255) {
      errors.push("File name must be less than 255 characters");
    }

    if (!this.key || this.key.trim().length === 0) {
      errors.push("Storage key is required");
    }

    if (!this.url || this.url.trim().length === 0) {
      errors.push("File URL is required");
    }

    if (this.url && !this.isValidUrl(this.url)) {
      errors.push("File URL is not a valid URL");
    }

    if (!this.type || this.type.trim().length === 0) {
      errors.push("MIME type is required");
    }

    if (!this.type.includes("/")) {
      errors.push("MIME type must follow the format 'type/subtype'");
    }

    if (this.size <= 0) {
      errors.push("File size must be greater than 0");
    }

    if (!this.uploaderId) {
      errors.push("Uploader ID is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toJSON(): Upload {
    return {
      id: this.id,
      name: this.name,
      url: this.url,
      key: this.key,
      type: this.type,
      size: this.size,
      uploaderId: this.uploaderId,
      isPublic: this.isPublic,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      uploader: this.uploader,
    };
  }

  // --- Private helpers ---

  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
}
