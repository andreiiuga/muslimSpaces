import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@muslimspaces/shared";
import { Button, Input, Text, colors, spacing } from "@muslimspaces/ui";
import { useAuth } from "../src/auth/AuthContext";

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
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
      setError(err instanceof ApiError ? err.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.md }}>
      <Text size="xl" weight="bold">Sign up</Text>
      <Input label="Email" kind="email" value={email} onChangeText={setEmail} />
      <Input label="Password (min. 8 characters)" kind="password" value={password} onChangeText={setPassword} />
      {error && <Text size="sm" color={colors.danger}>{error}</Text>}
      <Button onPress={handleSubmit} loading={submitting} fullWidth>
        {submitting ? "Signing up…" : "Sign up"}
      </Button>
      <Pressable onPress={() => router.replace("/login")}>
        <Text size="sm" color={colors.textMuted} align="center">
          Already have an account? <Text size="sm" color={colors.primary}>Log in</Text>
        </Text>
      </Pressable>
    </View>
  );
}
