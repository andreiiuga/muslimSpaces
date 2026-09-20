import { z } from "zod";
import {
  authResponseSchema,
  authUserSchema,
  type ChangePasswordPayload,
  type LoginPayload,
  type SignupPayload,
  type UpdateProfilePayload,
} from "./schemas/auth";
import { categorySchema, type CreateCategoryPayload, type UpdateCategoryPayload } from "./schemas/category";
import { citySchema, type CreateCityPayload } from "./schemas/city";
import {
  poiSchema,
  type CreatePoiPayload,
  type ListPoisQuery,
  type ModeratePoiPayload,
  type SetPoiVisibilityPayload,
  type UpdatePoiPayload,
} from "./schemas/poi";
import { poiHourSchema, type SetPoiHoursPayload } from "./schemas/poi-hours";
import { poiImageSchema, type AttachPoiImagePayload } from "./schemas/poi-image";
import { mediaUploadResponseSchema } from "./schemas/media";
import {
  reviewSchema,
  type ListReviewsQuery,
  type SetReviewStatusPayload,
  type SubmitReviewPayload,
} from "./schemas/review";
import { favoriteSchema } from "./schemas/favorite";
import {
  blogPostSchema,
  type CreateBlogPostPayload,
  type SetBlogPostStatusPayload,
  type UpdateBlogPostPayload,
} from "./schemas/blog";
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
        // Fastify's default JSON body parser rejects an empty body when
        // Content-Type claims JSON (e.g. POST /pois/:id/favorite, which
        // takes no body) — only set this header when there's actually a
        // body to parse.
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
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

  /** Multipart upload — separate from `request` since it must NOT set a JSON Content-Type. */
  async function uploadFile<TSchema extends z.ZodTypeAny>(
    path: string,
    schema: TSchema,
    file: Blob,
    filename: string,
  ): Promise<z.infer<TSchema>> {
    const token = await getToken?.();
    const form = new FormData();
    form.append("file", file, filename);

    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
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
      updateProfile: (payload: UpdateProfilePayload) =>
        request("/auth/me/profile", authUserSchema, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
      changePassword: (payload: ChangePasswordPayload) =>
        request("/auth/change-password", z.void(), {
          method: "POST",
          body: JSON.stringify(payload),
        }),
    },
    categories: {
      list: () => request("/categories", z.array(categorySchema)),
      create: (payload: CreateCategoryPayload) =>
        request("/categories", categorySchema, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      update: (id: string, payload: UpdateCategoryPayload) =>
        request(`/categories/${id}`, categorySchema, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
    },
    cities: {
      list: () => request("/cities", z.array(citySchema)),
      create: (payload: CreateCityPayload) =>
        request("/cities", citySchema, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
    },
    pois: {
      list: (query?: Partial<ListPoisQuery>) =>
        request(`/pois${toQueryString(query)}`, z.array(poiSchema)),
      get: (id: string) => request(`/pois/${id}`, poiSchema),
      // Admin editing — any status, not just approved. Moderator/admin only.
      getForAdmin: (id: string) => request(`/pois/${id}/admin`, poiSchema),
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
      setVisibility: (id: string, payload: SetPoiVisibilityPayload) =>
        request(`/pois/${id}/visibility`, poiSchema, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
      remove: (id: string) => request(`/pois/${id}`, z.void(), { method: "DELETE" }),
      // Admin moderation queue — moderator/admin only.
      pending: () => request("/pois/pending", z.array(poiSchema)),
      nearby: (query: RadiusQuery) =>
        request(`/pois/nearby${toQueryString(query)}`, z.array(poiSchema)),
      nearest: (query: NearestQuery) =>
        request(`/pois/nearest${toQueryString(query)}`, z.array(poiSchema)),
      bbox: (query: BboxQuery) =>
        request(`/pois/bbox${toQueryString(query)}`, z.array(poiSchema)),

      hours: {
        list: (poiId: string) => request(`/pois/${poiId}/hours`, z.array(poiHourSchema)),
        set: (poiId: string, payload: SetPoiHoursPayload) =>
          request(`/pois/${poiId}/hours`, z.array(poiHourSchema), {
            method: "PUT",
            body: JSON.stringify(payload),
          }),
      },
      images: {
        list: (poiId: string) => request(`/pois/${poiId}/images`, z.array(poiImageSchema)),
        attach: (poiId: string, payload: AttachPoiImagePayload) =>
          request(`/pois/${poiId}/images`, poiImageSchema, {
            method: "POST",
            body: JSON.stringify(payload),
          }),
        remove: (poiId: string, imageId: string) =>
          request(`/pois/${poiId}/images/${imageId}`, z.void(), { method: "DELETE" }),
      },
      favorite: {
        add: (poiId: string) =>
          request(`/pois/${poiId}/favorite`, favoriteSchema, { method: "POST" }),
        remove: (poiId: string) =>
          request(`/pois/${poiId}/favorite`, z.void(), { method: "DELETE" }),
      },
      reviews: {
        list: (poiId: string) => request(`/pois/${poiId}/reviews`, z.array(reviewSchema)),
        submit: (poiId: string, payload: SubmitReviewPayload) =>
          request(`/pois/${poiId}/reviews`, reviewSchema, {
            method: "POST",
            body: JSON.stringify(payload),
          }),
      },
    },
    favorites: {
      mine: () => request("/favorites/mine", z.array(poiSchema)),
    },
    reviews: {
      mine: () => request("/reviews/mine", z.array(reviewSchema)),
      // Admin moderation listing — moderator/admin only.
      list: (query?: Partial<ListReviewsQuery>) =>
        request(`/reviews${toQueryString(query)}`, z.array(reviewSchema)),
      setStatus: (reviewId: string, payload: SetReviewStatusPayload) =>
        request(`/reviews/${reviewId}`, reviewSchema, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
      remove: (reviewId: string) =>
        request(`/reviews/${reviewId}`, z.void(), { method: "DELETE" }),
    },
    media: {
      upload: (file: Blob, filename: string) =>
        uploadFile("/media", mediaUploadResponseSchema, file, filename),
    },
    blog: {
      list: () => request("/blog", z.array(blogPostSchema)),
      // Admin management view — every post regardless of status.
      listAll: () => request("/blog/admin/list", z.array(blogPostSchema)),
      get: (slug: string) => request(`/blog/${slug}`, blogPostSchema),
      create: (payload: CreateBlogPostPayload) =>
        request("/blog", blogPostSchema, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      update: (id: string, payload: UpdateBlogPostPayload) =>
        request(`/blog/${id}`, blogPostSchema, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
      setStatus: (id: string, payload: SetBlogPostStatusPayload) =>
        request(`/blog/${id}/status`, blogPostSchema, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
      remove: (id: string) => request(`/blog/${id}`, z.void(), { method: "DELETE" }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
