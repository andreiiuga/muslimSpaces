import { z } from "zod";
import {
  authResponseSchema,
  authUserSchema,
  type LoginPayload,
  type SignupPayload,
} from "./schemas/auth";
import { categorySchema, type CreateCategoryPayload } from "./schemas/category";
import {
  poiSchema,
  type CreatePoiPayload,
  type ModeratePoiPayload,
  type UpdatePoiPayload,
} from "./schemas/poi";
import type { PaginationQuery } from "./schemas/common";
import type { BboxQuery, NearestQuery, RadiusQuery } from "./schemas/geo";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiClientOptions {
  /** Backend's public Railway URL (or http://localhost:3001 in dev). No trailing slash. */
  baseUrl: string;
  /** Called per-request; return null/undefined to send unauthenticated. */
  getToken?: () => string | null | undefined | Promise<string | null | undefined>;
}

function toQueryString(params: Record<string, unknown> | undefined): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function createApiClient({ baseUrl, getToken }: ApiClientOptions) {
  async function request<TSchema extends z.ZodTypeAny>(
    path: string,
    schema: TSchema,
    init?: RequestInit,
  ): Promise<z.infer<TSchema>> {
    const token = await getToken?.();
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });

    const body = await res.json().catch(() => undefined);
    if (!res.ok) {
      throw new ApiError(
        (body as { message?: string } | undefined)?.message ?? res.statusText,
        res.status,
        body,
      );
    }
    return schema.parse(body);
  }

  return {
    auth: {
      signup: (payload: SignupPayload) =>
        request("/auth/signup", authResponseSchema, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      login: (payload: LoginPayload) =>
        request("/auth/login", authResponseSchema, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      me: () => request("/auth/me", authUserSchema),
    },
    categories: {
      list: () => request("/categories", z.array(categorySchema)),
      create: (payload: CreateCategoryPayload) =>
        request("/categories", categorySchema, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
    },
    pois: {
      list: (query?: Partial<PaginationQuery> & { categoryId?: string; cityId?: string }) =>
        request(`/pois${toQueryString(query)}`, z.array(poiSchema)),
      get: (id: string) => request(`/pois/${id}`, poiSchema),
      create: (payload: CreatePoiPayload) =>
        request("/pois", poiSchema, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      update: (id: string, payload: UpdatePoiPayload) =>
        request(`/pois/${id}`, poiSchema, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
      moderate: (id: string, payload: ModeratePoiPayload) =>
        request(`/pois/${id}/moderate`, poiSchema, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
      nearby: (query: RadiusQuery) =>
        request(`/pois/nearby${toQueryString(query)}`, z.array(poiSchema)),
      nearest: (query: NearestQuery) =>
        request(`/pois/nearest${toQueryString(query)}`, z.array(poiSchema)),
      bbox: (query: BboxQuery) =>
        request(`/pois/bbox${toQueryString(query)}`, z.array(poiSchema)),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
