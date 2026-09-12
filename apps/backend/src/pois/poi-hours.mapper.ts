import type { PoiHour } from "@muslimspaces/shared";
import { PoiHourEntity } from "./entities/poi-hour.entity";

// DB stores "HH:MM:SS" (Postgres time), the API surface is "HH:MM".
export function toPoiHourDto(entity: PoiHourEntity): PoiHour {
  return {
    id: entity.id,
    dayOfWeek: entity.dayOfWeek,
    opensAt: entity.opensAt.slice(0, 5),
    closesAt: entity.closesAt.slice(0, 5),
  };
}
