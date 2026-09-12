import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { setReviewStatusSchema } from "@muslimspaces/shared";
import type { SetReviewStatusPayload } from "@muslimspaces/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { ReviewsService } from "./reviews.service";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

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
