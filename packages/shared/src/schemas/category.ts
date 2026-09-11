import { z } from "zod";
import { localizedTextSchema } from "./common";

export const categorySchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: localizedTextSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Category = z.infer<typeof categorySchema>;

export const createCategorySchema = z.object({
  slug: categorySchema.shape.slug,
  name: localizedTextSchema,
});
export type CreateCategoryPayload = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryPayload = z.infer<typeof updateCategorySchema>;
