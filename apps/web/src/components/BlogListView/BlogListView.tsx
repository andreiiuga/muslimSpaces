"use client";

import Link from "next/link";
import type { BlogPost } from "@muslimspaces/shared";
import { Text, colors } from "@muslimspaces/ui";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";

export function BlogListView({ posts }: { posts: BlogPost[] }) {
  const { locale, t } = useLocale();

  if (posts.length === 0) {
    return (
      <div className="mx-auto max-w-[1340px] px-[clamp(16px,4vw,28px)] pb-[60px] pt-[30px]">
        <Text color={colors.textMuted}>{t("blog.empty")}</Text>
      </div>
    );
  }

  const [featured, ...rest] = posts;

  return (
    <div className="mx-auto flex max-w-[1340px] flex-col gap-[26px] px-[clamp(16px,4vw,28px)] pb-[60px] pt-[30px]">
      <div>
        <Text size="xs" weight="medium" color={colors.textMuted}>{t("blog.kicker").toUpperCase()}</Text>
        <div className="mt-[6px]">
          <Text size="3xl" weight="semibold">{t("blog.heading")}</Text>
        </div>
      </div>

      {featured && (
        <Link
          href={`/blog/${featured.slug}`}
          className="flex flex-wrap gap-[22px] rounded-lg bg-surface p-[14px] text-text no-underline shadow-panel"
        >
          <div className="relative h-[clamp(180px,40vw,300px)] min-w-[min(280px,100%)] flex-[1_1_380px] overflow-hidden rounded-lg bg-primaryLight">
            {featured.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- pre-optimized WebP, see pois/[id]
              <img src={featured.coverImageUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="flex min-w-[280px] flex-[1_1_320px] flex-col justify-center gap-[10px] px-[12px] py-[10px]">
            {featured.publishedAt && (
              <Text size="xs" weight="medium" color={colors.primaryDark}>
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-lg">
          {rest.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="flex flex-col gap-[10px] rounded-lg bg-surface p-md text-text no-underline shadow-panel"
            >
              <div className="relative h-[180px] overflow-hidden rounded-lg bg-primaryLight">
                {post.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- pre-optimized WebP, see pois/[id]
                  <img src={post.coverImageUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              {post.publishedAt && (
                <Text size="xs" weight="medium" color={colors.primaryDark}>
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
