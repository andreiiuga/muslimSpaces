import { createApiClient } from "@muslimspaces/shared";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";

export function getApiClient(token?: string | null) {
  return createApiClient({
    baseUrl: API_BASE_URL,
    getToken: () => token,
  });
}
