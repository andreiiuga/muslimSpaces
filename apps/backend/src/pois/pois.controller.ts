import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  bboxQuerySchema,
  createPoiSchema,
  listPoisQuerySchema,
  moderatePoiSchema,
  nearestQuerySchema,
  paginationQuerySchema,
  radiusQuerySchema,
  setPoiVisibilitySchema,
  updatePoiSchema,
} from "@muslimspaces/shared";
import type {
  BboxQuery,
  CreatePoiPayload,
  ListPoisQuery,
  ModeratePoiPayload,
  NearestQuery,
  PaginationQuery,
  RadiusQuery,
  SetPoiVisibilityPayload,
  UpdatePoiPayload,
} from "@muslimspaces/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { PoisService } from "./pois.service";

@Controller("pois")
export class PoisController {
  constructor(private readonly poisService: PoisService) {}

  // Public feed — approved POIs only. Static paths below must stay declared
  // before the dynamic ":id" route so they aren't swallowed by it.
  @Get()
  list(@Query(new ZodValidationPipe(listPoisQuerySchema)) query: ListPoisQuery) {
    return this.poisService.listApproved(query);
  }

  @Get("nearby")
  nearby(@Query(new ZodValidationPipe(radiusQuerySchema)) query: RadiusQuery) {
    return this.poisService.radiusSearch(query);
  }

  @Get("nearest")
  nearest(@Query(new ZodValidationPipe(nearestQuerySchema)) query: NearestQuery) {
    return this.poisService.nearestSearch(query);
  }

  @Get("bbox")
  bbox(@Query(new ZodValidationPipe(bboxQuerySchema)) query: BboxQuery) {
    return this.poisService.bboxSearch(query);
  }

  // Moderation queue — never exposed on the public list/detail endpoints.
  @Get("pending")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("moderator", "admin")
  pending() {
    return this.poisService.listPending();
  }

  // Admin table's paginated "everything else" — unlike the public list()
  // above, no status/visibility filter, so hidden and rejected POIs (which
  // list() excludes on purpose) stay findable and manageable here.
  @Get("admin/list")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("moderator", "admin")
  listAllForAdmin(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery) {
    return this.poisService.listAllForAdmin(query);
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.poisService.getApproved(id);
  }

  // Two path segments — can never collide with ":id" (always exactly one
  // segment), regardless of the id's value.
  @Get(":id/admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("moderator", "admin")
  detailForAdmin(@Param("id") id: string) {
    return this.poisService.getAny(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body(new ZodValidationPipe(createPoiSchema)) body: CreatePoiPayload,
    @CurrentUser() user: RequestUser,
  ) {
    return this.poisService.create(body, user);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updatePoiSchema)) body: UpdatePoiPayload,
    @CurrentUser() user: RequestUser,
  ) {
    return this.poisService.update(id, body, user);
  }

  @Patch(":id/moderate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("moderator", "admin")
  moderate(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(moderatePoiSchema)) body: ModeratePoiPayload,
  ) {
    return this.poisService.moderate(id, body);
  }

  @Patch(":id/visibility")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("moderator", "admin")
  setVisibility(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(setPoiVisibilitySchema)) body: SetPoiVisibilityPayload,
  ) {
    return this.poisService.setVisibility(id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("moderator", "admin")
  remove(@Param("id") id: string) {
    return this.poisService.remove(id);
  }
}
