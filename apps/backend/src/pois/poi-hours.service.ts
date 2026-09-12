import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { PoiHour, SetPoiHoursPayload } from "@muslimspaces/shared";
import type { RequestUser } from "../auth/decorators/current-user.decorator";
import { PoiEntity } from "./entities/poi.entity";
import { PoiHourEntity } from "./entities/poi-hour.entity";
import { toPoiHourDto } from "./poi-hours.mapper";

@Injectable()
export class PoiHoursService {
  constructor(
    @InjectRepository(PoiHourEntity)
    private readonly poiHoursRepository: Repository<PoiHourEntity>,
    @InjectRepository(PoiEntity)
    private readonly poisRepository: Repository<PoiEntity>,
  ) {}

  async list(poiId: string): Promise<PoiHour[]> {
    const rows = await this.poiHoursRepository.find({
      where: { poiId },
      order: { dayOfWeek: "ASC", opensAt: "ASC" },
    });
    return rows.map(toPoiHourDto);
  }

  async setHours(poiId: string, payload: SetPoiHoursPayload, user: RequestUser): Promise<PoiHour[]> {
    const poi = await this.poisRepository.findOne({ where: { id: poiId } });
    if (!poi) throw new NotFoundException("POI not found");

    // Hours change independently of content moderation (e.g. Ramadan
    // hours) — unlike core POI fields, the owner can edit anytime, not
    // just while pending.
    const isModerator = user.role === "moderator" || user.role === "admin";
    if (!isModerator && poi.submittedById !== user.userId) {
      throw new ForbiddenException("Not allowed to edit this POI's hours");
    }

    await this.poiHoursRepository.delete({ poiId });
    if (payload.length > 0) {
      await this.poiHoursRepository.save(
        payload.map((h) =>
          this.poiHoursRepository.create({
            poiId,
            dayOfWeek: h.dayOfWeek,
            opensAt: `${h.opensAt}:00`,
            closesAt: `${h.closesAt}:00`,
          }),
        ),
      );
    }
    return this.list(poiId);
  }
}
