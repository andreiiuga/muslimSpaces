import { z } from "zod";

export const favoriteSchema = z.object({
  poiId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type Favorite = z.infer<typeof favoriteSchema>;
