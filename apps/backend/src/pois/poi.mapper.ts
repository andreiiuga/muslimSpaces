import type { Poi } from "@muslimspaces/shared";
import { fromGeoPoint } from "../common/geo-point";
import { PoiEntity } from "./entities/poi.entity";

export function toPoiDto(entity: PoiEntity): Poi {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description ?? undefined,
    categoryId: entity.categoryId,
    cityId: entity.cityId ?? undefined,
    location: fromGeoPoint(entity.location),
    address: entity.address,
    phone: entity.phone ?? undefined,
    website: entity.website ?? undefined,
    openingHours: entity.openingHours ?? undefined,
    status: entity.status,
    submittedBy: entity.submittedById,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
