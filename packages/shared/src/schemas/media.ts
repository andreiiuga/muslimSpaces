import { z } from "zod";

// Response from POST /media — the generic upload endpoint used for both POI
// images and blog content/cover images. `storageKey` is the content-hashed
// base key in the bucket; the caller derives which variant it needs.
export const mediaUploadResponseSchema = z.object({
  storageKey: z.string().min(1),
  url: z.string().url(),
  thumbnailUrl: z.string().url(),
});
export type MediaUploadResponse = z.infer<typeof mediaUploadResponseSchema>;
