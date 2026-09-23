"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BlogPost } from "@muslimspaces/shared";
import { colors, Text } from "@muslimspaces/ui";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";
import { BackLink } from "../BackLink/BackLink";

export function BlogPostView({ post }: { post: BlogPost }) {
  const { locale, t } = useLocale();

  return (
    <div className="mx-auto flex max-w-[780px] flex-col gap-lg px-[clamp(16px,4vw,28px)] pb-[70px] pt-[26px]">
      <BackLink href="/blog" className="self-start">{t("blog.backDesk")}</BackLink>

      {post.publishedAt && (
        <Text size="xs" weight="medium" color={colors.primaryDark}>
          {new Date(post.publishedAt).toLocaleDateString()}
        </Text>
      )}
      <Text size="3xl" weight="semibold">{pickLocalized(post.title, locale)}</Text>
      <Text size="lg" color={colors.textMuted}>{pickLocalized(post.excerpt, locale)}</Text>

      {post.coverImageUrl && (
        <div className="my-[6px] h-[clamp(180px,34vw,340px)] overflow-hidden rounded-xl bg-primaryLight">
          {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimized WebP, see pois/[id] */}
          <img src={post.coverImageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="text-md leading-[1.7] text-textBody">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{pickLocalized(post.content, locale)}</ReactMarkdown>
      </div>
    </div>
  );
}
