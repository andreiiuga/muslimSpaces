import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { listReviewsQuerySchema, setReviewStatusSchema } from "@muslimspaces/shared";
import type { ListReviewsQuery, SetReviewStatusPayload } from "@muslimspaces/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { ReviewsService } from "./reviews.service";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Admin moderation listing — must stay above ":id"-shaped routes... this
  // one has zero path segments so there's no ordering risk, but "mine"
  // (one segment, static) still needs to precede any single-segment
  // dynamic route if one is ever added here.
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("moderator", "admin")
  list(@Query(new ZodValidationPipe(listReviewsQuerySchema)) query: ListReviewsQuery) {
    return this.reviewsService.listAll(query);
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: RequestUser) {
    return this.reviewsService.listMine(user.userId);
  }

  // Reactive takedown, not a pre-publish gate — see ReviewsService.
  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("moderator", "admin")
  setStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(setReviewStatusSchema)) body: SetReviewStatusPayload,
  ) {
    return this.reviewsService.setStatus(id, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.reviewsService.remove(id, user);
  }
}
