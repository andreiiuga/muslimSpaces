import type { Review } from "@muslimspaces/shared";
import { ReviewEntity } from "./entities/review.entity";

export function toReviewDto(entity: ReviewEntity): Review {
  return {
    id: entity.id,
    poiId: entity.poiId,
    userId: entity.userId,
    rating: entity.rating,
    comment: entity.comment,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
