import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/** Storage abstraction — swap implementation without touching order logic. */
export interface StorageBackend {
  upload(key: string, body: Buffer, contentType: string): Promise<string>;
}

// ── R2 Implementation ─────────────────────────────────────────────

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const bucket = process.env.R2_BUCKET || "yardxwork-files";

const r2Storage: StorageBackend = {
  async upload(key, body, contentType) {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    return key;
  },
};

// ── Export active backend ─────────────────────────────────────────

export const storage: StorageBackend = r2Storage;
