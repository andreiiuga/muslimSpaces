import type { Poi } from "@muslimspaces/shared";
import { fromGeoPoint } from "../common/geo-point";
import { PoiEntity } from "./entities/poi.entity";

export interface PoiCategoryInfo {
  categoryIds: string[];
  primaryCategoryId: string;
}

export function toPoiDto(entity: PoiEntity, categories: PoiCategoryInfo, thumbnailUrl: string | null = null): Poi {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description ?? undefined,
    categoryIds: categories.categoryIds,
    primaryCategoryId: categories.primaryCategoryId,
    cityId: entity.cityId ?? undefined,
    location: fromGeoPoint(entity.location),
    address: entity.address,
    phone: entity.phone ?? undefined,
    website: entity.website ?? undefined,
    ratingAvg: entity.ratingAvg !== null ? Number(entity.ratingAvg) : null,
    ratingCount: entity.ratingCount,
    thumbnailUrl,
    status: entity.status,
    visibility: entity.visibility,
    submittedBy: entity.submittedById,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
