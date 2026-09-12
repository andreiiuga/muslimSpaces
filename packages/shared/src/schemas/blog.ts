import { z } from "zod";
import { localizedTextSchema } from "./common";

export const blogPostStatusSchema = z.enum(["draft", "published"]);
export type BlogPostStatus = z.infer<typeof blogPostStatusSchema>;

const blogPostWritableFields = {
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: localizedTextSchema,
  excerpt: localizedTextSchema,
  // Markdown per locale. Images are plain markdown ![alt](url) pointing at
  // the bucket — no block-based content model, no separate content-image
  // table. See CLAUDE.md practices.
  content: localizedTextSchema,
  coverImageKey: z.string().min(1).optional(),
};

export const blogPostSchema = z.object({
  id: z.string().uuid(),
  ...blogPostWritableFields,
  coverImageUrl: z.string().url().optional(),
  authorId: z.string().uuid(),
  status: blogPostStatusSchema,
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type BlogPost = z.infer<typeof blogPostSchema>;

export const createBlogPostSchema = z.object(blogPostWritableFields);
export type CreateBlogPostPayload = z.infer<typeof createBlogPostSchema>;

export const updateBlogPostSchema = z.object(blogPostWritableFields).partial();
export type UpdateBlogPostPayload = z.infer<typeof updateBlogPostSchema>;

export const setBlogPostStatusSchema = z.object({
  status: blogPostStatusSchema,
});
export type SetBlogPostStatusPayload = z.infer<typeof setBlogPostStatusSchema>;
