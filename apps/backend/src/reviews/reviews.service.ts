import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, Repository } from "typeorm";
import type { Review, SetReviewStatusPayload, SubmitReviewPayload } from "@muslimspaces/shared";
import type { RequestUser } from "../auth/decorators/current-user.decorator";
import { PoiEntity } from "../pois/entities/poi.entity";
import { ReviewEntity, ReviewStatus } from "./entities/review.entity";
import { toReviewDto } from "./review.mapper";

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewsRepository: Repository<ReviewEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async listForPoi(poiId: string): Promise<Review[]> {
    const rows = await this.reviewsRepository.find({
      where: { poiId, status: ReviewStatus.PUBLISHED },
      order: { createdAt: "DESC" },
    });
    return rows.map(toReviewDto);
  }

  async listMine(userId: string): Promise<Review[]> {
    // Own reviews regardless of status — a hidden review is still the
    // user's content, they should be able to find/see it in "my reviews".
    const rows = await this.reviewsRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    return rows.map(toReviewDto);
  }

  // One review per (poi, user) — submitting again edits the existing row.
  async submit(poiId: string, userId: string, payload: SubmitReviewPayload): Promise<Review> {
    return this.dataSource.transaction(async (manager) => {
      const poi = await manager.findOne(PoiEntity, { where: { id: poiId } });
      if (!poi) throw new NotFoundException("POI not found");

      let review = await manager.findOne(ReviewEntity, { where: { poiId, userId } });
      if (review) {
        review.rating = payload.rating;
        review.comment = payload.comment ?? null;
        // Deliberately NOT resetting status to published here — editing
        // shouldn't be a way to undo a moderator's hide.
      } else {
        review = manager.create(ReviewEntity, {
          poiId,
          userId,
          rating: payload.rating,
          comment: payload.comment ?? null,
        });
      }
      const saved = await manager.save(review);

      await this.recomputeRating(manager, poiId);
      return toReviewDto(saved);
    });
  }

  async setStatus(reviewId: string, payload: SetReviewStatusPayload): Promise<Review> {
    return this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(ReviewEntity, { where: { id: reviewId } });
      if (!review) throw new NotFoundException("Review not found");
      review.status = payload.status === "hidden" ? ReviewStatus.HIDDEN : ReviewStatus.PUBLISHED;
      const saved = await manager.save(review);
      await this.recomputeRating(manager, review.poiId);
      return toReviewDto(saved);
    });
  }

  async remove(reviewId: string, user: RequestUser): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(ReviewEntity, { where: { id: reviewId } });
      if (!review) throw new NotFoundException("Review not found");

      const isModerator = user.role === "moderator" || user.role === "admin";
      if (!isModerator && review.userId !== user.userId) {
        throw new ForbiddenException("Not allowed to delete this review");
      }

      const poiId = review.poiId;
      await manager.remove(review);
      await this.recomputeRating(manager, poiId);
    });
  }

  /** Denormalized onto pois.rating_avg/rating_count so reads never need an aggregate join. */
  private async recomputeRating(manager: EntityManager, poiId: string): Promise<void> {
    const result = await manager
      .createQueryBuilder(ReviewEntity, "r")
      .select("AVG(r.rating)", "avg")
      .addSelect("COUNT(*)", "count")
      .where("r.poi_id = :poiId", { poiId })
      .andWhere("r.status = :status", { status: ReviewStatus.PUBLISHED })
      .getRawOne<{ avg: string | null; count: string }>();

    await manager.update(PoiEntity, poiId, {
      ratingAvg: result?.avg ? Number(result.avg).toFixed(2) : null,
      ratingCount: result ? Number(result.count) : 0,
    });
  }
}
