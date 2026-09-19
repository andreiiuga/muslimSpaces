import { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import type { BlogPost } from "@muslimspaces/shared";
import { Card, Skeleton, Text, colors, radii, spacing } from "@muslimspaces/ui";
import { api } from "../../src/lib/api-client";
import { TAB_BAR_HEIGHT } from "../../src/components/CustomTabBar";
import { pickLocalized } from "../../src/i18n/pick-localized";
import type { LocaleCode } from "../../src/i18n";

// The tab-bar entry for Blog — moved here from the old pushed `blog/index`
// route now that Blog is a 4th tab (see CustomTabBar/navigation/tabs.ts).
// `blog/[slug]` stays a pushed detail route outside the tab group, same
// pattern as `pois/[id]`.
export default function BlogListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;
  const tabBarClearance = TAB_BAR_HEIGHT + insets.bottom + spacing.xl;
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.blog
      .list()
      .then(setPosts)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        <Text color={colors.dangerDark}>{t("blog.loadError")}</Text>
      </View>
    );
  }

  if (!posts) {
    return (
      <View style={{ padding: spacing.xl, paddingTop: insets.top + spacing.xl, gap: spacing.lg }}>
        <Skeleton height={220} borderRadius={radii.cardLg} />
        <Skeleton height={220} borderRadius={radii.cardLg} />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: spacing.xl, paddingTop: insets.top + spacing.xl, paddingBottom: tabBarClearance, gap: spacing.lg, flexGrow: 1 }}
      ListHeaderComponent={
        <View style={{ marginBottom: spacing.md, gap: 2 }}>
          <Text size="xs" weight="medium" color={colors.textMuted}>
            {t("blog.kicker").toUpperCase()}
          </Text>
          <Text size="3xl" weight="semibold">
            {t("blog.heading")}
          </Text>
        </View>
      }
      ListEmptyComponent={<Text color={colors.textMuted}>{t("blog.empty")}</Text>}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/blog/${item.slug}`)}>
          <Card elevated radius={radii.cardLg} padding={spacing.md}>
            <View style={{ gap: spacing.sm }}>
              <View style={{ height: 150, borderRadius: radii.lg, backgroundColor: colors.primaryLight, overflow: "hidden" }}>
                {item.coverImageUrl && (
                  <Image source={{ uri: item.coverImageUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                )}
              </View>
              {item.publishedAt && (
                <Text size="xs" weight="medium" color={colors.primaryDark}>
                  {new Date(item.publishedAt).toLocaleDateString()}
                </Text>
              )}
              <Text size="xl" weight="semibold">
                {pickLocalized(item.title, locale)}
              </Text>
              <Text size="md" color={colors.textBody}>
                {pickLocalized(item.excerpt, locale)}
              </Text>
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}
