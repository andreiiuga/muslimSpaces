import type { Category } from "@muslimspaces/shared";
import { CategoryEntity } from "./entities/category.entity";

export function toCategoryDto(entity: CategoryEntity): Category {
  return {
    id: entity.id,
    slug: entity.slug,
    name: entity.name,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
