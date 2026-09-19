"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { BlogPost } from "@muslimspaces/shared";
import { colors, radii, Text } from "@muslimspaces/ui";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";

export function BlogPostView({ post }: { post: BlogPost }) {
  const { locale, t } = useLocale();
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "26px clamp(16px,4vw,28px) 70px", display: "flex", flexDirection: "column", gap: 16 }}>
      <Link href="/blog" style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 8, minHeight: 44, fontSize: 14, color: colors.primary, textDecoration: "none" }}>
        <BackIcon size={18} /> {t("blog.backDesk")}
      </Link>

      {post.publishedAt && (
        <Text size="xs" weight="medium" color={colors.primaryDark} letterSpacing={1.4}>
          {new Date(post.publishedAt).toLocaleDateString()}
        </Text>
      )}
      <Text size="3xl" weight="semibold">{pickLocalized(post.title, locale)}</Text>
      <Text size="lg" color={colors.textMuted}>{pickLocalized(post.excerpt, locale)}</Text>

      {post.coverImageUrl && (
        <div style={{ height: "clamp(180px,34vw,340px)", borderRadius: radii.xl, overflow: "hidden", background: colors.primaryLight, margin: "6px 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimized WebP, see pois/[id] */}
          <img src={post.coverImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      <div style={{ fontSize: 17, lineHeight: 1.7, color: colors.textBody }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{pickLocalized(post.content, locale)}</ReactMarkdown>
      </div>
    </div>
  );
}
