import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import type { MediaUploadResponse } from "@muslimspaces/shared";

const DISPLAY_WIDTH = 1200;
const THUMBNAIL_WIDTH = 300;

@Injectable()
export class MediaService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase: string;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>("S3_BUCKET");
    this.publicUrlBase = config.getOrThrow<string>("S3_PUBLIC_URL_BASE").replace(/\/$/, "");
    this.s3 = new S3Client({
      region: config.get<string>("S3_REGION") ?? "auto",
      endpoint: config.getOrThrow<string>("S3_ENDPOINT"),
      // Most S3-compatible providers (MinIO, Railway's bucket) use
      // path-style addressing (host/bucket/key), not AWS's virtual-hosted
      // style (bucket.host/key).
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.getOrThrow<string>("S3_ACCESS_KEY_ID"),
        secretAccessKey: config.getOrThrow<string>("S3_SECRET_ACCESS_KEY"),
      },
    });
  }

  /**
   * Never stores the raw upload — resizes to two WebP variants (thumbnail
   * for list/map views, display for detail views) and discards the
   * original. Content-hashed key means re-uploading the same image is a
   * no-op collision, and the immutable Cache-Control is always safe.
   */
  async upload(buffer: Buffer): Promise<MediaUploadResponse> {
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 32);
    const baseKey = `media/${hash}`;

    const [display, thumbnail] = await Promise.all([
      sharp(buffer).resize({ width: DISPLAY_WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
      sharp(buffer).resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer(),
    ]);

    const displayKey = `${baseKey}-display.webp`;
    const thumbnailKey = `${baseKey}-thumb.webp`;

    await Promise.all([
      this.putObject(displayKey, display),
      this.putObject(thumbnailKey, thumbnail),
    ]);

    return {
      storageKey: baseKey,
      url: this.publicUrl(displayKey),
      thumbnailUrl: this.publicUrl(thumbnailKey),
    };
  }

  /** Derive URLs for an already-uploaded base key — no re-upload needed. */
  urlsForKey(baseKey: string): { url: string; thumbnailUrl: string } {
    return {
      url: this.publicUrl(`${baseKey}-display.webp`),
      thumbnailUrl: this.publicUrl(`${baseKey}-thumb.webp`),
    };
  }

  private publicUrl(key: string): string {
    return `${this.publicUrlBase}/${key}`;
  }

  private async putObject(key: string, body: Buffer): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }
}
