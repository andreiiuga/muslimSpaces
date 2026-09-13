import * as SecureStore from "expo-secure-store";
import { createApiClient } from "@muslimspaces/shared";

const TOKEN_KEY = "muslimspaces_token";

// EXPO_PUBLIC_* vars are inlined into the JS bundle at build time. On a
// physical device/simulator, "localhost" means the device itself, not your
// dev machine — use your machine's LAN IP for local dev, and the backend's
// public Railway URL for anything else.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

// No httpOnly-cookie constraint here (unlike web) — the token lives in
// SecureStore and the client attaches it directly, no auth-proxy needed.
export const api = createApiClient({
  baseUrl: API_BASE_URL,
  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
});

export function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}
