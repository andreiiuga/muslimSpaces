import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  bboxQuerySchema,
  createPoiSchema,
  listPoisQuerySchema,
  moderatePoiSchema,
  nearestQuerySchema,
  radiusQuerySchema,
  updatePoiSchema,
} from "@muslimspaces/shared";
import type {
  BboxQuery,
  CreatePoiPayload,
  ListPoisQuery,
  ModeratePoiPayload,
  NearestQuery,
  RadiusQuery,
  UpdatePoiPayload,
} from "@muslimspaces/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { PoisService } from "./pois.service";
import { toPoiDto } from "./poi.mapper";

@Controller("pois")
export class PoisController {
  constructor(private readonly poisService: PoisService) {}

  // Public feed — approved POIs only. Static paths below must stay declared
  // before the dynamic ":id" route so they aren't swallowed by it.
  @Get()
  async list(@Query(new ZodValidationPipe(listPoisQuerySchema)) query: ListPoisQuery) {
    const pois = await this.poisService.listApproved(query);
    return pois.map(toPoiDto);
  }

  @Get("nearby")
  async nearby(@Query(new ZodValidationPipe(radiusQuerySchema)) query: RadiusQuery) {
    const pois = await this.poisService.radiusSearch(query);
    return pois.map(toPoiDto);
  }

  @Get("nearest")
  async nearest(@Query(new ZodValidationPipe(nearestQuerySchema)) query: NearestQuery) {
    const pois = await this.poisService.nearestSearch(query);
    return pois.map(toPoiDto);
  }

  @Get("bbox")
  async bbox(@Query(new ZodValidationPipe(bboxQuerySchema)) query: BboxQuery) {
    const pois = await this.poisService.bboxSearch(query);
    return pois.map(toPoiDto);
  }

  // Moderation queue — never exposed on the public list/detail endpoints.
  @Get("pending")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("moderator", "admin")
  async pending() {
    const pois = await this.poisService.listPending();
    return pois.map(toPoiDto);
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const poi = await this.poisService.findApprovedByIdOrThrow(id);
    return toPoiDto(poi);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body(new ZodValidationPipe(createPoiSchema)) body: CreatePoiPayload,
    @CurrentUser() user: RequestUser,
  ) {
    const poi = await this.poisService.create(body, user.userId);
    return toPoiDto(poi);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updatePoiSchema)) body: UpdatePoiPayload,
    @CurrentUser() user: RequestUser,
  ) {
    const poi = await this.poisService.update(id, body, user);
    return toPoiDto(poi);
  }

  @Patch(":id/moderate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("moderator", "admin")
  async moderate(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(moderatePoiSchema)) body: ModeratePoiPayload,
  ) {
    const poi = await this.poisService.moderate(id, body);
    return toPoiDto(poi);
  }
}
