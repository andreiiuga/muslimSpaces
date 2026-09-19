import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { spacing } from "@muslimspaces/ui";
import { useAuth } from "../../src/auth/AuthContext";
import { EditProfileForm } from "../../src/components/EditProfileForm";

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  if (!user) {
    router.replace("/(tabs)/profile");
    return null;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
      <View>
        <EditProfileForm user={user} onUpdated={() => refreshUser()} />
      </View>
    </ScrollView>
  );
}
