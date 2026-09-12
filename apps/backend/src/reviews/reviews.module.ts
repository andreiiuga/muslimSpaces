import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReviewEntity } from "./entities/review.entity";
import { PoiEntity } from "../pois/entities/poi.entity";
import { ReviewsService } from "./reviews.service";
import { ReviewsController } from "./reviews.controller";
import { PoiReviewsController } from "./poi-reviews.controller";
import { UserThrottlerGuard } from "./user-throttler.guard";

@Module({
  imports: [TypeOrmModule.forFeature([ReviewEntity, PoiEntity])],
  controllers: [ReviewsController, PoiReviewsController],
  providers: [ReviewsService, UserThrottlerGuard],
})
export class ReviewsModule {}
