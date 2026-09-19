import { useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ApiError } from "@muslimspaces/shared";
import { Button, Input, Text, colors, spacing } from "@muslimspaces/ui";
import { useAuth } from "../src/auth/AuthContext";

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await signup(email, password);
      router.replace("/(tabs)/profile");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.signingUp"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing["2xl"], gap: spacing.md }}>
      <Text size="xs" weight="medium" color={colors.textMuted}>{t("auth.signupKicker").toUpperCase()}</Text>
      <Text size="3xl" weight="semibold">{t("auth.signupTitle")}</Text>
      <Input label={t("auth.email")} kind="email" value={email} onChangeText={setEmail} />
      <Input label={t("auth.password")} kind="password" value={password} onChangeText={setPassword} />
      {error && <Text size="sm" color={colors.dangerDark}>{error}</Text>}
      <Button onPress={handleSubmit} loading={submitting} fullWidth>
        {submitting ? t("auth.signingUp") : t("common.signUp")}
      </Button>
      <Pressable onPress={() => router.replace("/login")} style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }}>
        <Text size="sm" color={colors.textMuted} align="center">
          {t("auth.haveAccount")} <Text size="sm" color={colors.primary}>{t("common.logIn")}</Text>
        </Text>
      </Pressable>
      <Text size="xs" color={colors.textMuted} align="center">{t("auth.note")}</Text>
    </ScrollView>
  );
}
