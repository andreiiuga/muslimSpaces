import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import Markdown from "react-native-markdown-display";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ApiError } from "@muslimspaces/shared";
import type { BlogPost } from "@muslimspaces/shared";
import { Skeleton, Text, colors, fontSizes, spacing } from "@muslimspaces/ui";
import { api } from "../../src/lib/api-client";
import { pickLocalized } from "../../src/i18n/pick-localized";
import type { LocaleCode } from "../../src/i18n";

export default function BlogPostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.blog
      .get(slug)
      .then(setPost)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(true);
      });
  }, [slug]);

  if (notFound) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        <Text color={colors.textMuted}>{t("poi.notFound")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        <Text color={colors.dangerDark}>{t("blog.loadError")}</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        <Skeleton height={220} borderRadius={16} />
        <Skeleton height={24} width="70%" />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: spacing["2xl"], gap: spacing.md }}>
      <Stack.Screen options={{ title: "" }} />
      <View style={{ paddingHorizontal: spacing.xl, gap: 6 }}>
        {post.publishedAt && (
          <Text size="xs" weight="medium" color={colors.primaryDark}>
            {new Date(post.publishedAt).toLocaleDateString()}
          </Text>
        )}
        <Text size="3xl" weight="semibold">{pickLocalized(post.title, locale)}</Text>
        <Text size="md" color={colors.textMuted}>{pickLocalized(post.excerpt, locale)}</Text>
      </View>
      {post.coverImageUrl && (
        <Image
          source={{ uri: post.coverImageUrl }}
          style={{ width: "100%", height: 196, backgroundColor: colors.primaryLight }}
          contentFit="cover"
        />
      )}
      <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xs }}>
        <Markdown style={{ body: { fontSize: fontSizes.md, color: colors.textBody, lineHeight: fontSizes.md * 1.66 } }}>
          {pickLocalized(post.content, locale)}
        </Markdown>
      </View>
    </ScrollView>
  );
}
