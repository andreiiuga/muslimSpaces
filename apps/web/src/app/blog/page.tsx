import Link from "next/link";
import type { Metadata } from "next";
import { colors, spacing, Text } from "@muslimspaces/ui";
import { getApiClient } from "../../lib/api-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — MuslimSpaces",
  description: "News, guides, and community stories for Muslims in Romania.",
};

export default async function BlogListPage() {
  const posts = await getApiClient().blog.list();

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: spacing.xl }}>
      <Text size="2xl" weight="bold">Blog</Text>

      {posts.length === 0 ? (
        <Text color={colors.textMuted}>No posts yet.</Text>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing["2xl"], marginTop: spacing.xl }}>
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              {post.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- pre-optimized WebP, see pois/[id]
                <img
                  src={post.coverImageUrl}
                  alt=""
                  style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 16 }}
                />
              )}
              <div style={{ marginTop: spacing.sm }}>
                <Text size="lg" weight="semibold">{post.title.ro}</Text>
                <Text size="sm" color={colors.textMuted}>{post.excerpt.ro}</Text>
                {post.publishedAt && (
                  <Text size="xs" color={colors.textMuted}>
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </Text>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
