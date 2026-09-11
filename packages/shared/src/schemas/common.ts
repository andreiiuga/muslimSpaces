import { z } from "zod";

/**
 * Public POI content must support at least Romanian + English.
 * `.catchall` allows adding more languages later without a schema change.
 */
export const localizedTextSchema = z
  .object({
    ro: z.string().min(1),
    en: z.string().min(1),
  })
  .catchall(z.string().min(1));
export type LocalizedText = z.infer<typeof localizedTextSchema>;

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type Coordinates = z.infer<typeof coordinatesSchema>;

export const roleSchema = z.enum(["user", "moderator", "admin"]);
export type Role = z.infer<typeof roleSchema>;

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
