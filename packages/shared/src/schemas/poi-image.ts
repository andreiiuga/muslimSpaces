import { z } from "zod";

export const poiImageRoleSchema = z.enum(["logo", "cover", "gallery"]);
export type PoiImageRole = z.infer<typeof poiImageRoleSchema>;

export const poiImageSchema = z.object({
  id: z.string().uuid(),
  role: poiImageRoleSchema,
  url: z.string().url(),
  thumbnailUrl: z.string().url(),
  sortOrder: z.number().int(),
});
export type PoiImage = z.infer<typeof poiImageSchema>;

// storageKey comes from a prior POST /media upload — attaching is a
// separate step from uploading, so the same uploaded image could in
// principle be reused (e.g. re-attached after a failed save) without
// re-uploading.
export const attachPoiImageSchema = z.object({
  role: poiImageRoleSchema,
  storageKey: z.string().min(1),
  sortOrder: z.number().int().default(0),
});
export type AttachPoiImagePayload = z.infer<typeof attachPoiImageSchema>;

// Full replacement order, not a single-item move — simplest contract for a
// drag/up-down admin UI: send the complete ordered id list, the server sets
// sortOrder = array index for each.
export const reorderPoiImagesSchema = z.object({
  imageIds: z.array(z.string().uuid()).min(1),
});
export type ReorderPoiImagesPayload = z.infer<typeof reorderPoiImagesSchema>;
