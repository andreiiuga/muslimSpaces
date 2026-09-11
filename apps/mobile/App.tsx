import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { createApiClient, type Poi } from "@muslimspaces/shared";

// EXPO_PUBLIC_* vars are inlined into the JS bundle at build time (Expo's
// equivalent of Next's NEXT_PUBLIC_*). On a physical device/simulator,
// "localhost" means the device itself, not your dev machine — use your
// machine's LAN IP for local dev, and the backend's public Railway URL
// for anything else.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

const api = createApiClient({ baseUrl: API_BASE_URL });

export default function App() {
  const [pois, setPois] = useState<Poi[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.pois
      .list({ limit: 20 })
      .then(setPois)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>MuslimSpaces</Text>

      {error && <Text style={styles.error}>{error}</Text>}
      {!pois && !error && <ActivityIndicator />}

      {pois && (
        <FlatList
          data={pois}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemTitle}>{item.name.en}</Text>
              <Text>{item.address}</Text>
            </View>
          )}
          ListEmptyComponent={<Text>No approved POIs yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: "600", marginBottom: 12 },
  item: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  itemTitle: { fontWeight: "600" },
  error: { color: "red" },
});
