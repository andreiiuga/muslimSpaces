import { z } from "zod";

export const poiImageRoleSchema = z.enum(["logo", "cover", "gallery"]);
export type PoiImageRole = z.infer<typeof poiImageRoleSchema>;

// One entry per distinct uploaded image: the same picture can carry several
// roles at once (e.g. cover + logo + gallery) without being uploaded twice.
// Storage-wise that is one poi_images row per role sharing a storage_key;
// the API groups them back together. `id` is the first row's id and is the
// handle for delete / reorder / setRoles on the whole image.
export const poiImageSchema = z.object({
  id: z.string().uuid(),
  roles: z.array(poiImageRoleSchema).min(1),
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

// Replaces the full set of roles an existing image has. Roles not listed are
// removed, new ones added; at least one must remain (delete the image
// instead to remove it entirely).
export const setPoiImageRolesSchema = z.object({
  roles: z.array(poiImageRoleSchema).min(1),
});
export type SetPoiImageRolesPayload = z.infer<typeof setPoiImageRolesSchema>;
