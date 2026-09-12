import { BadRequestException, Controller, Post, Req, UseGuards } from "@nestjs/common";
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
}
