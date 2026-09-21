import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Req,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { MediaService } from "./media.service";

@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // Generic upload endpoint reused by POI images and blog cover/content
  // images — one sharp+bucket pipeline, not duplicated per feature.
  @Post()
  @UseGuards(JwtAuthGuard)
  async upload(@Req() request: FastifyRequest) {
    const file = await request.file();
    if (!file) throw new BadRequestException("No file uploaded");
    const buffer = await file.toBuffer();
    return this.mediaService.upload(buffer);
  }

  // Public, unauthenticated — this is what every url/thumbnailUrl this app
  // hands out actually points at. Railway buckets are private-only (no
  // public-bucket mode), so this proxy is the only way a stored image is
  // ever reachable; see MediaService.getObject()'s comment.
  @Get(":filename")
  @Header("Cache-Control", "public, max-age=31536000, immutable")
  async serve(@Param("filename") filename: string) {
    const bytes = await this.mediaService.getObject(filename);
    // type set via StreamableFile's own options, not @Header — its
    // built-in interceptor sets Content-Type itself and would otherwise
    // win over (overwrite) a plain @Header("Content-Type", ...) here.
    return new StreamableFile(bytes, { type: "image/webp" });
  }
}
