import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ApiError } from "@muslimspaces/shared";
import { getApiClient } from "../../../lib/api-client";
import { BlogPostView } from "../../../components/BlogPostView/BlogPostView";

// ISR — see pois/[id]/page.tsx for the cache/single-instance notes.
// Admin blog writes through this app call revalidateBlog() for instant
// updates. Must stay free of cookies()/headers().
export const revalidate = 3600;

// Generated on first hit, then cached.
export function generateStaticParams() {
  return [];
}

async function getPost(slug: string) {
  try {
    return await getApiClient().blog.get(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return { title: `${post.title.ro} — MuslimSpaces`, description: post.excerpt.ro };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return <BlogPostView post={post} />;
}
