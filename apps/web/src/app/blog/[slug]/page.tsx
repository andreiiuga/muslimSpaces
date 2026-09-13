import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ApiError } from "@muslimspaces/shared";
import { colors, spacing, Text } from "@muslimspaces/ui";
import { getApiClient } from "../../../lib/api-client";

export const dynamic = "force-dynamic";

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

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: spacing.xl }}>
      {post.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- pre-optimized WebP, see pois/[id]
        <img
          src={post.coverImageUrl}
          alt=""
          style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 16, marginBottom: spacing.lg }}
        />
      )}
      <Text size="2xl" weight="bold">{post.title.ro}</Text>
      {post.publishedAt && (
        <Text size="sm" color={colors.textMuted}>
          {new Date(post.publishedAt).toLocaleDateString()}
        </Text>
      )}
      <div style={{ marginTop: spacing.lg, lineHeight: 1.7 }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content.ro}</ReactMarkdown>
      </div>
    </main>
  );
}
