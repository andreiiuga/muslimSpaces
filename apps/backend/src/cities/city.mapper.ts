import type { City } from "@muslimspaces/shared";
import { CityEntity } from "./entities/city.entity";

export function toCityDto(entity: CityEntity): City {
  return {
    id: entity.id,
    slug: entity.slug,
    name: entity.name,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
