import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ApiError } from "@muslimspaces/shared";
import { Button, Input, Text, colors, spacing } from "@muslimspaces/ui";
import { useAuth } from "../src/auth/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/(tabs)/profile");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.loggingIn"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing["2xl"], gap: spacing.md }}>
      <Text size="xs" weight="medium" color={colors.textMuted}>{t("auth.loginKicker").toUpperCase()}</Text>
      <Text size="3xl" weight="semibold">{t("auth.loginTitle")}</Text>
      <Input label={t("auth.email")} kind="email" value={email} onChangeText={setEmail} />
      <Input label={t("auth.password")} kind="password" value={password} onChangeText={setPassword} />
      {error && <Text size="sm" color={colors.dangerDark}>{error}</Text>}
      <Button onPress={handleSubmit} loading={submitting} fullWidth>
        {submitting ? t("auth.loggingIn") : t("auth.loginTitle")}
      </Button>
      <Pressable onPress={() => router.replace("/signup")} style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }}>
        <Text size="sm" color={colors.textMuted} align="center">
          {t("auth.needAccount")} <Text size="sm" color={colors.primary}>{t("common.signUp")}</Text>
        </Text>
      </Pressable>
      <Text size="xs" color={colors.textMuted} align="center">{t("auth.note")}</Text>
    </ScrollView>
  );
}
