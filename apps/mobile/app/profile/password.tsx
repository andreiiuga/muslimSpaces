import { ScrollView } from "react-native";
import { spacing } from "@muslimspaces/ui";
import { ChangePasswordForm } from "../../src/components/ChangePasswordForm";

export default function ChangePasswordScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
      <ChangePasswordForm />
    </ScrollView>
  );
}
