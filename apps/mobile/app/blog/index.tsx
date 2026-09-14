import { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import type { BlogPost } from "@muslimspaces/shared";
import { Skeleton, Text, colors, spacing } from "@muslimspaces/ui";
import { api } from "../../src/lib/api-client";

export default function BlogListScreen() {
  const router = useRouter();
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
        <Text color={colors.danger}>Couldn't load the blog. Try again later.</Text>
      </View>
    );
  }

  if (!posts) {
    return (
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <Skeleton height={180} borderRadius={16} />
        <Skeleton height={180} borderRadius={16} />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: spacing.xl, gap: spacing["2xl"] }}
      ListEmptyComponent={<Text color={colors.textMuted}>No posts yet.</Text>}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/blog/${item.slug}`)}>
          {item.coverImageUrl && (
            <Image
              source={{ uri: item.coverImageUrl }}
              style={{ width: "100%", height: 180, borderRadius: 16 }}
              contentFit="cover"
            />
          )}
          <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
            <Text size="lg" weight="semibold">{item.title.ro}</Text>
            <Text size="sm" color={colors.textMuted}>{item.excerpt.ro}</Text>
            {item.publishedAt && (
              <Text size="xs" color={colors.textMuted}>
                {new Date(item.publishedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </Pressable>
      )}
    />
  );
}
