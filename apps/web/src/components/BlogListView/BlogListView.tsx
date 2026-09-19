"use client";

import Link from "next/link";
import type { BlogPost } from "@muslimspaces/shared";
import { Text, colors, radii } from "@muslimspaces/ui";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";

export function BlogListView({ posts }: { posts: BlogPost[] }) {
  const { locale, t } = useLocale();

  if (posts.length === 0) {
    return (
      <div style={{ maxWidth: 1340, margin: "0 auto", padding: "30px clamp(16px,4vw,28px) 60px" }}>
        <Text color={colors.textMuted}>{t("blog.empty")}</Text>
      </div>
    );
  }

  const [featured, ...rest] = posts;

  return (
    <div style={{ maxWidth: 1340, margin: "0 auto", padding: "30px clamp(16px,4vw,28px) 60px", display: "flex", flexDirection: "column", gap: 26 }}>
      <div>
        <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>{t("blog.kicker").toUpperCase()}</Text>
        <div style={{ marginTop: 6 }}>
          <Text size="3xl" weight="semibold">{t("blog.heading")}</Text>
        </div>
      </div>

      {featured && (
        <Link
          href={`/blog/${featured.slug}`}
          style={{ background: colors.surface, borderRadius: radii.lg, boxShadow: "0 1px 3px rgba(28,25,23,.08),0 6px 18px rgba(28,25,23,.05)", padding: 14, display: "flex", gap: 22, flexWrap: "wrap", textDecoration: "none", color: colors.text }}
        >
          <div style={{ flex: "1 1 380px", minWidth: "min(280px,100%)", height: "clamp(180px,40vw,300px)", borderRadius: 16, position: "relative", overflow: "hidden", background: colors.primaryLight }}>
            {featured.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- pre-optimized WebP, see pois/[id]
              <img src={featured.coverImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>
          <div style={{ flex: "1 1 320px", minWidth: 280, display: "flex", flexDirection: "column", gap: 10, justifyContent: "center", padding: "10px 12px" }}>
            {featured.publishedAt && (
              <Text size="xs" weight="medium" color={colors.primaryDark} letterSpacing={1.4}>
                {new Date(featured.publishedAt).toLocaleDateString()}
              </Text>
            )}
            <Text size="2xl" weight="semibold">{pickLocalized(featured.title, locale)}</Text>
            <Text size="lg" color={colors.textBody}>{pickLocalized(featured.excerpt, locale)}</Text>
            <Text size="sm" color={colors.primary}>{t("blog.readOn")}</Text>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18 }}>
          {rest.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              style={{ background: colors.surface, borderRadius: radii.lg, boxShadow: "0 1px 3px rgba(28,25,23,.08),0 6px 18px rgba(28,25,23,.05)", padding: 12, display: "flex", flexDirection: "column", gap: 10, textDecoration: "none", color: colors.text }}
            >
              <div style={{ height: 180, borderRadius: 13, position: "relative", overflow: "hidden", background: colors.primaryLight }}>
                {post.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- pre-optimized WebP, see pois/[id]
                  <img src={post.coverImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              {post.publishedAt && (
                <Text size="xs" weight="medium" color={colors.primaryDark} letterSpacing={1.4}>
                  {new Date(post.publishedAt).toLocaleDateString()}
                </Text>
              )}
              <Text size="xl" weight="semibold">{pickLocalized(post.title, locale)}</Text>
              <Text size="sm" color={colors.textBody}>{pickLocalized(post.excerpt, locale)}</Text>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
