import type { Metadata } from "next";
import { colors, spacing, Text } from "@muslimspaces/ui";

export const metadata: Metadata = {
  title: "About — MuslimSpaces",
  description: "Why MuslimSpaces exists and how it works.",
};

export default function AboutPage() {
  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: spacing.xl }}>
      <Text size="2xl" weight="bold">About MuslimSpaces</Text>

      <div style={{ marginTop: spacing.lg, display: "flex", flexDirection: "column", gap: spacing.lg }}>
        <Text>
          MuslimSpaces helps Muslims in Romania find mosques, halal restaurants, Islamic
          learning centers, and other services near them — on a map, with real reviews from
          the community.
        </Text>
        <Text>
          Every place on MuslimSpaces is submitted by someone in the community and checked by
          a moderator before it goes live, so listings stay accurate and trustworthy.
        </Text>
        <Text>
          Know a place that should be listed? Sign up and add it — it’ll be reviewed and
          published as soon as a moderator approves it.
        </Text>
        <Text size="sm" color={colors.textMuted}>
          Have a question or found something wrong on the site? Reach out — we’re a small,
          community-run project.
        </Text>
      </div>
    </main>
  );
}
