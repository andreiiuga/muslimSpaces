import { ScrollView } from "react-native";
import { Text, colors, spacing } from "@muslimspaces/ui";

export default function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <Text size="2xl" weight="bold">About MuslimSpaces</Text>
      <Text>
        MuslimSpaces helps Muslims in Romania find mosques, halal restaurants, Islamic learning
        centers, and other services near them — on a map, with real reviews from the community.
      </Text>
      <Text>
        Every place on MuslimSpaces is submitted by someone in the community and checked by a
        moderator before it goes live, so listings stay accurate and trustworthy.
      </Text>
      <Text>
        Know a place that should be listed? Sign up and add it — it&apos;ll be reviewed and
        published as soon as a moderator approves it.
      </Text>
      <Text size="sm" color={colors.textMuted}>
        Have a question or found something wrong on the site? Reach out — we&apos;re a small,
        community-run project.
      </Text>
    </ScrollView>
  );
}
