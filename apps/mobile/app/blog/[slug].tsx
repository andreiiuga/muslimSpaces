import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import Markdown from "react-native-markdown-display";
import { Stack, useLocalSearchParams } from "expo-router";
import { ApiError } from "@muslimspaces/shared";
import type { BlogPost } from "@muslimspaces/shared";
import { Skeleton, Text, colors, fontSizes, spacing } from "@muslimspaces/ui";
import { api } from "../../src/lib/api-client";

export default function BlogPostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
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
        <Text color={colors.textMuted}>This post isn't available.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        <Text color={colors.danger}>Couldn't load this post. Try again later.</Text>
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
    <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
      <Stack.Screen options={{ title: post.title.ro }} />
      {post.coverImageUrl && (
        <Image
          source={{ uri: post.coverImageUrl }}
          style={{ width: "100%", height: 220, borderRadius: 16, marginBottom: spacing.lg }}
          contentFit="cover"
        />
      )}
      <Text size="2xl" weight="bold">{post.title.ro}</Text>
      {post.publishedAt && (
        <Text size="sm" color={colors.textMuted}>
          {new Date(post.publishedAt).toLocaleDateString()}
        </Text>
      )}
      <View style={{ marginTop: spacing.lg }}>
        <Markdown style={{ body: { fontSize: fontSizes.md, color: colors.text, lineHeight: 24 } }}>
          {post.content.ro}
        </Markdown>
      </View>
    </ScrollView>
  );
}
