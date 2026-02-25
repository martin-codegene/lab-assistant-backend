import { UUID } from "@shared/types";
import { Experiment } from "./experiment";
import { User } from "./user";

export enum AttachmentType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
  DATA_FILE = "DATA_FILE",
  AUDIO = "AUDIO",
}

// Allowed MIME types per attachment type
const ALLOWED_MIME_TYPES: Record<AttachmentType, string[]> = {
  [AttachmentType.IMAGE]: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/tiff",
    "image/bmp",
  ],
  [AttachmentType.VIDEO]: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
  ],
  [AttachmentType.DOCUMENT]: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ],
  [AttachmentType.DATA_FILE]: [
    "application/json",
    "text/csv",
    "text/plain",
    "application/xml",
    "text/xml",
    "application/octet-stream",
  ],
  [AttachmentType.AUDIO]: [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/aac",
  ],
};

// Max file sizes per attachment type (bytes)
const MAX_FILE_SIZES: Record<AttachmentType, number> = {
  [AttachmentType.IMAGE]: 20 * 1024 * 1024,       // 20 MB
  [AttachmentType.VIDEO]: 500 * 1024 * 1024,      // 500 MB
  [AttachmentType.DOCUMENT]: 50 * 1024 * 1024,    // 50 MB
  [AttachmentType.DATA_FILE]: 100 * 1024 * 1024,  // 100 MB
  [AttachmentType.AUDIO]: 100 * 1024 * 1024,      // 100 MB
};

export interface Attachment {
  id: UUID;
  experimentId: string;
  type: AttachmentType;
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;

  // Metadata
  uploadedById: string;
  uploadedAt: Date;

  // Relations (populated when fetched)
  experiment?: Experiment;
  uploadedBy?: User;
}

export interface CreateAttachmentInput {
  experimentId: string;
  type: AttachmentType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  uploadedById: string;
}

export interface UpdateAttachmentInput {
  description?: string;
  thumbnailUrl?: string;
}

export class AttachmentEntity implements Attachment {
  id: string;
  experimentId: string;
  type: AttachmentType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  uploadedById: string;
  uploadedAt: Date;
  experiment?: Experiment;
  uploadedBy?: User;

  constructor(data: Attachment) {
    this.id = data.id;
    this.experimentId = data.experimentId;
    this.type = data.type;
    this.fileName = data.fileName;
    this.fileSize = data.fileSize;
    this.mimeType = data.mimeType;
    this.url = data.url;
    this.thumbnailUrl = data.thumbnailUrl;
    this.description = data.description;
    this.uploadedById = data.uploadedById;
    this.uploadedAt = data.uploadedAt;
    this.experiment = data.experiment;
    this.uploadedBy = data.uploadedBy;
  }

  static create(input: CreateAttachmentInput): AttachmentEntity {
    return new AttachmentEntity({
      id: crypto.randomUUID(),
      experimentId: input.experimentId,
      type: input.type,
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      url: input.url,
      thumbnailUrl: input.thumbnailUrl,
      description: input.description,
      uploadedById: input.uploadedById,
      uploadedAt: new Date(),
    });
  }

  update(input: UpdateAttachmentInput): void {
    if (input.description !== undefined) this.description = input.description;
    if (input.thumbnailUrl !== undefined) this.thumbnailUrl = input.thumbnailUrl;
  }

  // --- Business logic ---

  /**
   * Returns a human-readable file size string (e.g. "1.2 MB", "340 KB").
   */
  get fileSizeFormatted(): string {
    const bytes = this.fileSize;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  /** Returns the file extension derived from the file name (lower-cased, without the dot). */
  get fileExtension(): string {
    const parts = this.fileName.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  }

  isImage(): boolean {
    return this.type === AttachmentType.IMAGE;
  }

  isVideo(): boolean {
    return this.type === AttachmentType.VIDEO;
  }

  isDocument(): boolean {
    return this.type === AttachmentType.DOCUMENT;
  }

  isDataFile(): boolean {
    return this.type === AttachmentType.DATA_FILE;
  }

  isAudio(): boolean {
    return this.type === AttachmentType.AUDIO;
  }

  /** True when this attachment can be displayed inline (images, videos). */
  isPreviewable(): boolean {
    return this.isImage() || this.isVideo();
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.experimentId) {
      errors.push("Experiment ID is required");
    }

    if (!this.fileName || this.fileName.trim().length === 0) {
      errors.push("File name is required");
    }

    if (this.fileName && this.fileName.length > 255) {
      errors.push("File name must be less than 255 characters");
    }

    if (!this.url || this.url.trim().length === 0) {
      errors.push("File URL is required");
    }

    if (this.url && !this.isValidUrl(this.url)) {
      errors.push("File URL is not a valid URL");
    }

    if (this.thumbnailUrl && !this.isValidUrl(this.thumbnailUrl)) {
      errors.push("Thumbnail URL is not a valid URL");
    }

    if (this.fileSize <= 0) {
      errors.push("File size must be greater than 0");
    }

    const maxSize = MAX_FILE_SIZES[this.type];
    if (this.fileSize > maxSize) {
      errors.push(
        `File size exceeds the maximum allowed size for ${this.type} (${this.formatBytes(maxSize)})`
      );
    }

    if (!this.mimeType || this.mimeType.trim().length === 0) {
      errors.push("MIME type is required");
    }

    const allowedMimes = ALLOWED_MIME_TYPES[this.type];
    if (this.mimeType && !allowedMimes.includes(this.mimeType)) {
      errors.push(
        `MIME type "${this.mimeType}" is not allowed for attachment type ${this.type}`
      );
    }

    if (!this.uploadedById) {
      errors.push("Uploader ID is required");
    }

    if (this.description && this.description.length > 1000) {
      errors.push("Description must be less than 1000 characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toJSON(): Attachment {
    return {
      id: this.id,
      experimentId: this.experimentId,
      type: this.type,
      fileName: this.fileName,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      url: this.url,
      thumbnailUrl: this.thumbnailUrl,
      description: this.description,
      uploadedById: this.uploadedById,
      uploadedAt: this.uploadedAt,
      experiment: this.experiment,
      uploadedBy: this.uploadedBy,
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

  private formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
}
