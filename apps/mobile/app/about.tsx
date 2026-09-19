import { Linking, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, Text, colors, spacing } from "@muslimspaces/ui";

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const body = t("about.body", { returnObjects: true }) as string[];

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <View style={{ gap: 4 }}>
        <Text size="xs" weight="medium" color={colors.textMuted}>{t("about.kicker").toUpperCase()}</Text>
        <Text size="2xl" weight="semibold">{t("about.title")}</Text>
      </View>

      {body.map((paragraph, i) => (
        <Text key={i} color={colors.textBody}>{paragraph}</Text>
      ))}

      <Button onPress={() => router.push("/pois/submit")} fullWidth>{t("submit.entryLabel")}</Button>

      <View style={{ borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md }}>
        <Pressable onPress={() => Linking.openURL("mailto:hello@muslimspaces.ro")}>
          <Text size="xs" color={colors.textMuted}>{t("about.footer")} · hello@muslimspaces.ro</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
