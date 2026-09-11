import { z } from "zod";
import { coordinatesSchema, localizedTextSchema, paginationQuerySchema } from "./common";

export const poiStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type PoiStatus = z.infer<typeof poiStatusSchema>;

const poiWritableFields = {
  name: localizedTextSchema,
  description: localizedTextSchema.optional(),
  categoryId: z.string().uuid(),
  cityId: z.string().uuid().optional(),
  location: coordinatesSchema,
  address: z.string().min(1),
  phone: z.string().min(1).optional(),
  website: z.string().url().optional(),
  openingHours: z.string().min(1).optional(),
};

export const poiSchema = z.object({
  id: z.string().uuid(),
  ...poiWritableFields,
  status: poiStatusSchema,
  submittedBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Poi = z.infer<typeof poiSchema>;

export const createPoiSchema = z.object(poiWritableFields);
export type CreatePoiPayload = z.infer<typeof createPoiSchema>;

export const updatePoiSchema = createPoiSchema.partial();
export type UpdatePoiPayload = z.infer<typeof updatePoiSchema>;

export const moderatePoiSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});
export type ModeratePoiPayload = z.infer<typeof moderatePoiSchema>;

// .extend (not .partial) on purpose: paginationQuerySchema's fields already
// carry defaults via z.default(...), and wrapping a defaulted field in
// .partial()'s implicit .optional() would short-circuit that default.
export const listPoisQuerySchema = paginationQuerySchema.extend({
  categoryId: z.string().uuid().optional(),
  cityId: z.string().uuid().optional(),
});
export type ListPoisQuery = z.infer<typeof listPoisQuerySchema>;
