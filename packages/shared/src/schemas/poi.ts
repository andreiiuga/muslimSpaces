import { z } from "zod";
import { coordinatesSchema, localizedTextSchema, paginationQuerySchema } from "./common";

export const poiStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type PoiStatus = z.infer<typeof poiStatusSchema>;

const poiWritableFields = {
  name: localizedTextSchema,
  description: localizedTextSchema.optional(),
  // A POI can belong to multiple categories (e.g. a mosque that's also a
  // Jamiah), so this is many-to-many, not a single categoryId. Exactly one
  // of categoryIds must be designated primaryCategoryId — used for the
  // quick-glance label / map pin icon / SEO category routing.
  categoryIds: z.array(z.string().uuid()).min(1),
  primaryCategoryId: z.string().uuid(),
  cityId: z.string().uuid().optional(),
  location: coordinatesSchema,
  address: z.string().min(1),
  phone: z.string().min(1).optional(),
  website: z.string().url().optional(),
};

export const poiSchema = z.object({
  id: z.string().uuid(),
  ...poiWritableFields,
  // Denormalized from `reviews` — recomputed on every review write so reads
  // (list/map views) never need an aggregate join.
  ratingAvg: z.number().min(0).max(5).nullable(),
  ratingCount: z.number().int().nonnegative(),
  status: poiStatusSchema,
  submittedBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Poi = z.infer<typeof poiSchema>;

export const createPoiSchema = z.object(poiWritableFields).refine(
  (v) => v.categoryIds.includes(v.primaryCategoryId),
  { message: "primaryCategoryId must be one of categoryIds", path: ["primaryCategoryId"] },
);
export type CreatePoiPayload = z.infer<typeof createPoiSchema>;

// No cross-field .refine here on purpose: a partial update might touch only
// one of categoryIds/primaryCategoryId. The "primary must be a member of
// categoryIds" invariant is enforced server-side in PoisService, where the
// existing row's current values are available to reason about the merge.
export const updatePoiSchema = z.object(poiWritableFields).partial();
export type UpdatePoiPayload = z.infer<typeof updatePoiSchema>;

export const moderatePoiSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});
export type ModeratePoiPayload = z.infer<typeof moderatePoiSchema>;

// .extend (not .partial) on purpose: paginationQuerySchema's fields already
// carry defaults via z.default(...), and wrapping a defaulted field in
// .partial()'s implicit .optional() would short-circuit that default.
export const listPoisQuerySchema = paginationQuerySchema.extend({
  // Overrides paginationQuerySchema's own max(100) — the map view loads
  // every matching POI at once (for client-side clustering, not paged
  // display), which easily exceeds 100 nationwide. Default stays 20 so
  // every other /pois list consumer is unaffected.
  limit: z.coerce.number().int().positive().max(2000).default(20),
  categoryId: z.string().uuid().optional(),
  cityId: z.string().uuid().optional(),
  openNow: z.coerce.boolean().optional(),
  // Matched against name (both locales) and address — see
  // PoisService.applySearchFilter for the actual ILIKE query.
  search: z.string().min(1).max(200).optional(),
});
export type ListPoisQuery = z.infer<typeof listPoisQuerySchema>;
