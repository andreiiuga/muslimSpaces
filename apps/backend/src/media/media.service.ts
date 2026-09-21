import { createHash } from "node:crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
    // Despite the name, this is no longer a direct bucket URL — Railway
    // buckets are private-only with no public-bucket mode (confirmed via
    // Railway's own docs), so it's this backend's own public base URL, and
    // publicUrl() below points at this service's own GET /media/:filename
    // proxy instead of the bucket directly. Renaming the var would just
    // mean touching every deploy env — the "public URL base for serving
    // media" meaning still holds, just fulfilled differently now.
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

  /** Streams an object back out through this backend, keyed by the same
   * filename publicUrl() puts in the URL (the "media/" prefix is implicit,
   * not part of the route). Used by MediaController's GET /media/:filename —
   * the only way anything stored here is actually reachable, since the
   * bucket itself rejects unauthenticated requests. Every object this
   * service ever writes is a sharp-produced WebP (see upload() above), so
   * the content type is always the same. */
  async getObject(filename: string): Promise<Buffer> {
    try {
      const response = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: `media/${filename}` }),
      );
      const bytes = await response.Body?.transformToByteArray();
      if (!bytes) throw new NotFoundException("Image not found");
      return Buffer.from(bytes);
    } catch (error) {
      if ((error as { name?: string }).name === "NoSuchKey") {
        throw new NotFoundException("Image not found");
      }
      throw error;
    }
  }

  // key already includes its own "media/" prefix (see upload()'s baseKey) —
  // stripped here since GET /media/:filename's own route path re-supplies
  // that namespace, so the served URL doesn't read as .../media/media/....
  private publicUrl(key: string): string {
    return `${this.publicUrlBase}/media/${key.replace(/^media\//, "")}`;
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
