import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors } from "@muslimspaces/ui";
import { AuthProvider } from "../src/auth/AuthContext";

export default function RootLayout() {
  return (
    // Required at the root for @gorhom/bottom-sheet's pan gestures
    // (Explore tab's draggable POI sheet) to work anywhere in the tree.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="pois/[id]" options={{ title: "" }} />
          <Stack.Screen name="blog/index" options={{ title: "Blog" }} />
          <Stack.Screen name="blog/[slug]" options={{ title: "" }} />
          <Stack.Screen name="about" options={{ title: "About" }} />
          <Stack.Screen name="login" options={{ title: "Log in", presentation: "modal" }} />
          <Stack.Screen name="signup" options={{ title: "Sign up", presentation: "modal" }} />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
