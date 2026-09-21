import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { attachPoiImageSchema, reorderPoiImagesSchema } from "@muslimspaces/shared";
import type { AttachPoiImagePayload, ReorderPoiImagesPayload } from "@muslimspaces/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { PoiImagesService } from "./poi-images.service";

@Controller("pois/:poiId/images")
export class PoiImagesController {
  constructor(private readonly poiImagesService: PoiImagesService) {}

  @Get()
  list(@Param("poiId") poiId: string) {
    return this.poiImagesService.list(poiId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  attach(
    @Param("poiId") poiId: string,
    @Body(new ZodValidationPipe(attachPoiImageSchema)) body: AttachPoiImagePayload,
    @CurrentUser() user: RequestUser,
  ) {
    return this.poiImagesService.attach(poiId, body, user);
  }

  @Delete(":imageId")
  @UseGuards(JwtAuthGuard)
  remove(
    @Param("poiId") poiId: string,
    @Param("imageId") imageId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.poiImagesService.remove(poiId, imageId, user);
  }

  // Literal "reorder" segment — never collides with the ":imageId" delete
  // route above since image ids are always UUIDs, never the string "reorder".
  @Patch("reorder")
  @UseGuards(JwtAuthGuard)
  reorder(
    @Param("poiId") poiId: string,
    @Body(new ZodValidationPipe(reorderPoiImagesSchema)) body: ReorderPoiImagesPayload,
    @CurrentUser() user: RequestUser,
  ) {
    return this.poiImagesService.reorder(poiId, body, user);
  }
}
