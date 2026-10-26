import { IStorageAdapter } from "./storage.adapter";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  PutObjectAclCommand,
} from "@aws-sdk/client-s3";

/**
 * AwsStorageAdapter
 * -----------------
 * Stores files in an AWS S3 bucket.
 *
 * When running on AWS Lambda the SDK automatically picks up the execution
 * role credentials — no access key / secret needed in env vars.
 *
 * Required env vars:
 *   AWS_S3_BUCKET   – target bucket name
 *   AWS_REGION      – bucket region (defaults to "us-east-1")
 *
 * Optional (local dev only — prefer IAM roles in production):
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 */
export class AwsStorageAdapter implements IStorageAdapter {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION || "us-east-1";

    if (!bucket) {
      throw new Error(
        "[aws-storage] Missing required env var: AWS_S3_BUCKET"
      );
    }

    this.bucket = bucket;

    // When running locally with explicit credentials, the SDK picks them up
    // automatically from env vars (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY).
    // On Lambda, the execution role is used instead — no extra config needed.
    this.client = new S3Client({ region });
  }

  async upload(
    file: Blob | File,
    key: string,
    mimeType: string
  ): Promise<{ url: string; key: string }> {
    const buffer = Buffer.from(await file.arrayBuffer());

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    const url = `https://${this.bucket}.s3.amazonaws.com/${key}`;
    console.log(`[aws-storage] Uploaded: s3://${this.bucket}/${key}`);
    return { url, key };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
    console.log(`[aws-storage] Deleted: s3://${this.bucket}/${key}`);
  }

  async makePublic(key: string): Promise<string> {
    await this.client.send(
      new PutObjectAclCommand({
        Bucket: this.bucket,
        Key: key,
        ACL: "public-read",
      })
    );

    const url = `https://${this.bucket}.s3.amazonaws.com/${key}`;
    console.log(`[aws-storage] Made public: ${url}`);
    return url;
  }

  async makePrivate(key: string): Promise<void> {
    await this.client.send(
      new PutObjectAclCommand({
        Bucket: this.bucket,
        Key: key,
        ACL: "private",
      })
    );
    console.log(`[aws-storage] Made private: s3://${this.bucket}/${key}`);
  }
}
