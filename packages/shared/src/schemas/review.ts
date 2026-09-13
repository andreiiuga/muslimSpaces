import { z } from "zod";
import { paginationQuerySchema } from "./common";

// No "pending" state: reviews publish immediately (rate-limited instead of
// pre-moderated — see ReviewsModule). `hidden` is a moderator takedown
// after the fact, not a pre-publish gate.
export const reviewStatusSchema = z.enum(["published", "hidden"]);
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

export const reviewSchema = z.object({
  id: z.string().uuid(),
  poiId: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000).nullable(),
  status: reviewStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Review = z.infer<typeof reviewSchema>;

// One review per (poi, user) — submitting again edits the existing one
// rather than creating a duplicate. See PoisService/ReviewsService.
export const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000).optional(),
});
export type SubmitReviewPayload = z.infer<typeof submitReviewSchema>;

export const setReviewStatusSchema = z.object({
  status: reviewStatusSchema,
});
export type SetReviewStatusPayload = z.infer<typeof setReviewStatusSchema>;

// Admin moderation listing — GET /reviews, moderator/admin only.
export const listReviewsQuerySchema = paginationQuerySchema.extend({
  status: reviewStatusSchema.optional(),
});
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
