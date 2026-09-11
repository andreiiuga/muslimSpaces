import { z } from "zod";

/** Radius search around a point, e.g. GET /pois/nearby */
export const radiusQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().positive().max(50_000),
  categoryId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type RadiusQuery = z.infer<typeof radiusQuerySchema>;

/** Nearest POI(s) to a point, e.g. GET /pois/nearest */
export const nearestQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  categoryId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(20).default(1),
});
export type NearestQuery = z.infer<typeof nearestQuerySchema>;

/** Map viewport search, e.g. GET /pois/bbox */
export const bboxQuerySchema = z
  .object({
    minLat: z.coerce.number().min(-90).max(90),
    minLng: z.coerce.number().min(-180).max(180),
    maxLat: z.coerce.number().min(-90).max(90),
    maxLng: z.coerce.number().min(-180).max(180),
    categoryId: z.string().uuid().optional(),
    limit: z.coerce.number().int().positive().max(500).default(100),
  })
  .refine((v) => v.minLat <= v.maxLat && v.minLng <= v.maxLng, {
    message: "min bounds must be less than or equal to max bounds",
  });
export type BboxQuery = z.infer<typeof bboxQuerySchema>;
