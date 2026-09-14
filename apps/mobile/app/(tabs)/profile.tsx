import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, Button, Skeleton, Text, colors, spacing } from "@muslimspaces/ui";
import { useAuth } from "../../src/auth/AuthContext";
import { EditProfileForm } from "../../src/components/EditProfileForm";
import { ChangePasswordForm } from "../../src/components/ChangePasswordForm";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading, logout, refreshUser } = useAuth();
  const [localUser, setLocalUser] = useState(user);

  if (loading) {
    return (
      <View style={{ padding: spacing.xl, gap: spacing.lg, alignItems: "center" }}>
        <Skeleton width={72} height={72} circle />
        <Skeleton width="50%" height={20} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md }}>
        <Text weight="semibold" size="lg">Welcome to MuslimSpaces</Text>
        <Text color={colors.textMuted} align="center">Log in to save favorites and leave reviews.</Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Button onPress={() => router.push("/login")}>Log in</Button>
          <Button variant="secondary" onPress={() => router.push("/signup")}>Sign up</Button>
        </View>
        <FooterLinks />
      </View>
    );
  }

  const current = localUser ?? user;

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing["2xl"] }}>
      <View style={{ alignItems: "center", gap: spacing.sm }}>
        <Avatar uri={current.avatarUrl} name={current.displayName ?? current.email} size={72} />
        <Text weight="semibold" size="lg">{current.displayName ?? current.email}</Text>
        {current.displayName && <Text size="sm" color={colors.textMuted}>{current.email}</Text>}
      </View>

      <Section title="Profile">
        <EditProfileForm
          user={current}
          onUpdated={(updated) => {
            setLocalUser(updated);
            refreshUser();
          }}
        />
      </Section>

      <Section title="Password">
        <ChangePasswordForm />
      </Section>

      <FooterLinks />

      <Button variant="danger" onPress={handleLogout}>Log out</Button>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg, gap: spacing.md }}>
      <Text weight="semibold">{title}</Text>
      {children}
    </View>
  );
}

function FooterLinks() {
  const router = useRouter();
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.xl }}>
      <Pressable onPress={() => router.push("/blog")}>
        <Text size="sm" color={colors.primary}>Blog</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/about")}>
        <Text size="sm" color={colors.primary}>About</Text>
      </Pressable>
    </View>
  );
}
