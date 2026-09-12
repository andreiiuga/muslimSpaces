import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { submitReviewSchema } from "@muslimspaces/shared";
import type { SubmitReviewPayload } from "@muslimspaces/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { ReviewsService } from "./reviews.service";
import { UserThrottlerGuard } from "./user-throttler.guard";

@Controller("pois/:poiId/reviews")
export class PoiReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  list(@Param("poiId") poiId: string) {
    return this.reviewsService.listForPoi(poiId);
  }

  // 10 submissions/hour per user — open to everyone, not pre-moderated,
  // so rate limiting is the abuse guard instead of a review queue.
  @Post()
  @UseGuards(JwtAuthGuard, UserThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60 * 60 * 1000 } })
  submit(
    @Param("poiId") poiId: string,
    @Body(new ZodValidationPipe(submitReviewSchema)) body: SubmitReviewPayload,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reviewsService.submit(poiId, user.userId, body);
  }
}
