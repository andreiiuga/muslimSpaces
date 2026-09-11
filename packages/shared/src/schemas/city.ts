import { z } from "zod";
import { localizedTextSchema } from "./common";

export const citySchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), // e.g. "cluj-napoca", used in /cluj-napoca/mosques
  name: localizedTextSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type City = z.infer<typeof citySchema>;

export const createCitySchema = z.object({
  slug: citySchema.shape.slug,
  name: localizedTextSchema,
});
export type CreateCityPayload = z.infer<typeof createCitySchema>;
