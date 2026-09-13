import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, In, QueryFailedError, Repository } from "typeorm";
import type {
  BboxQuery,
  CreatePoiPayload,
  ListPoisQuery,
  ModeratePoiPayload,
  NearestQuery,
  Poi,
  RadiusQuery,
  UpdatePoiPayload,
} from "@muslimspaces/shared";
import { toGeoPoint } from "../common/geo-point";
import type { RequestUser } from "../auth/decorators/current-user.decorator";
import { PoiEntity, PoiStatus } from "./entities/poi.entity";
import { PoiCategoryAssignmentEntity } from "./entities/poi-category-assignment.entity";
import { toPoiDto, PoiCategoryInfo } from "./poi.mapper";

const FOREIGN_KEY_VIOLATION = "23503";

// True when a poi_hours row covers "now" in Europe/Bucharest — the app is
// Romania-only, so a single hardcoded timezone beats modeling one per POI.
// Handles overnight wraparound (closes_at <= opens_at, e.g. 20:00-02:00).
const OPEN_NOW_SQL = `
  EXISTS (
    SELECT 1 FROM poi_hours h
    WHERE h.poi_id = poi.id
      AND h.day_of_week = EXTRACT(ISODOW FROM (now() AT TIME ZONE 'Europe/Bucharest'))
      AND (
        (h.closes_at > h.opens_at AND (now() AT TIME ZONE 'Europe/Bucharest')::time BETWEEN h.opens_at AND h.closes_at)
        OR
        (h.closes_at <= h.opens_at AND (
          (now() AT TIME ZONE 'Europe/Bucharest')::time >= h.opens_at
          OR (now() AT TIME ZONE 'Europe/Bucharest')::time < h.closes_at
        ))
      )
  )
`;

@Injectable()
export class PoisService {
  constructor(
    @InjectRepository(PoiEntity)
    private readonly poisRepository: Repository<PoiEntity>,
    @InjectRepository(PoiCategoryAssignmentEntity)
    private readonly poiCategoriesRepository: Repository<PoiCategoryAssignmentEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async listApproved(query: ListPoisQuery): Promise<Poi[]> {
    const qb = this.poisRepository
      .createQueryBuilder("poi")
      .where("poi.status = :status", { status: PoiStatus.APPROVED });

    this.applyCategoryFilter(qb, query.categoryId);
    if (query.cityId) qb.andWhere("poi.city_id = :cityId", { cityId: query.cityId });
    if (query.openNow) qb.andWhere(OPEN_NOW_SQL);

    const pois = await qb
      .orderBy("poi.created_at", "DESC")
      .limit(query.limit)
      .offset(query.offset)
      .getMany();
    return this.toDtoList(pois);
  }

  async listPending(): Promise<Poi[]> {
    const pois = await this.poisRepository.find({
      where: { status: PoiStatus.PENDING },
      order: { createdAt: "ASC" },
    });
    return this.toDtoList(pois);
  }

  async getManyByIds(ids: string[]): Promise<Poi[]> {
    if (ids.length === 0) return [];
    const pois = await this.poisRepository.find({ where: { id: In(ids) } });
    return this.toDtoList(pois);
  }

  async getApproved(id: string): Promise<Poi> {
    const poi = await this.poisRepository.findOne({ where: { id, status: PoiStatus.APPROVED } });
    if (!poi) throw new NotFoundException("POI not found");
    return this.toDto(poi);
  }

  async create(payload: CreatePoiPayload, submitter: RequestUser): Promise<Poi> {
    // Moderators/admins don't need to self-approve their own submissions.
    const isModerator = submitter.role === "moderator" || submitter.role === "admin";

    const poiId = await this.runWrite(async (manager) => {
      const poi = manager.create(PoiEntity, {
        name: payload.name,
        description: payload.description ?? null,
        cityId: payload.cityId ?? null,
        location: toGeoPoint(payload.location.lat, payload.location.lng),
        address: payload.address,
        phone: payload.phone ?? null,
        website: payload.website ?? null,
        submittedById: submitter.userId,
        status: isModerator ? PoiStatus.APPROVED : PoiStatus.PENDING,
      });
      const saved = await manager.save(poi);

      await manager.save(
        PoiCategoryAssignmentEntity,
        payload.categoryIds.map((categoryId) => ({
          poiId: saved.id,
          categoryId,
          isPrimary: categoryId === payload.primaryCategoryId,
        })),
      );

      return saved.id;
    });

    return this.getDto(poiId);
  }

  async update(id: string, payload: UpdatePoiPayload, currentUser: RequestUser): Promise<Poi> {
    const poi = await this.poisRepository.findOne({ where: { id } });
    if (!poi) throw new NotFoundException("POI not found");

    const isModerator = currentUser.role === "moderator" || currentUser.role === "admin";
    const isOwnerOfPending = poi.submittedById === currentUser.userId && poi.status === PoiStatus.PENDING;
    if (!isModerator && !isOwnerOfPending) {
      throw new ForbiddenException("Not allowed to edit this POI");
    }

    // A partial update might touch only categoryIds or only
    // primaryCategoryId — merge with the current assignment set so the
    // "primary must be a member" invariant still holds after the write.
    let categoryIds = payload.categoryIds;
    let primaryCategoryId = payload.primaryCategoryId;
    if (categoryIds || primaryCategoryId) {
      const current = (await this.categoryInfoFor([id])).get(id) ?? {
        categoryIds: [],
        primaryCategoryId: "",
      };
      categoryIds = categoryIds ?? current.categoryIds;
      primaryCategoryId = primaryCategoryId ?? current.primaryCategoryId;
      if (!categoryIds.includes(primaryCategoryId)) {
        throw new BadRequestException("primaryCategoryId must be one of categoryIds");
      }
    }

    if (payload.name !== undefined) poi.name = payload.name;
    if (payload.description !== undefined) poi.description = payload.description ?? null;
    if (payload.cityId !== undefined) poi.cityId = payload.cityId ?? null;
    if (payload.location !== undefined) poi.location = toGeoPoint(payload.location.lat, payload.location.lng);
    if (payload.address !== undefined) poi.address = payload.address;
    if (payload.phone !== undefined) poi.phone = payload.phone ?? null;
    if (payload.website !== undefined) poi.website = payload.website ?? null;

    const finalCategoryIds = categoryIds;
    const finalPrimaryCategoryId = primaryCategoryId;

    await this.runWrite(async (manager) => {
      await manager.save(poi);
      if (finalCategoryIds) {
        await manager.delete(PoiCategoryAssignmentEntity, { poiId: id });
        await manager.save(
          PoiCategoryAssignmentEntity,
          finalCategoryIds.map((categoryId) => ({
            poiId: id,
            categoryId,
            isPrimary: categoryId === finalPrimaryCategoryId,
          })),
        );
      }
    });

    return this.getDto(id);
  }

  async moderate(id: string, payload: ModeratePoiPayload): Promise<Poi> {
    const poi = await this.poisRepository.findOne({ where: { id } });
    if (!poi) throw new NotFoundException("POI not found");
    poi.status = payload.status === "approved" ? PoiStatus.APPROVED : PoiStatus.REJECTED;
    await this.poisRepository.save(poi);
    return this.toDto(poi);
  }

  async remove(id: string): Promise<void> {
    const result = await this.poisRepository.delete({ id });
    if (result.affected === 0) throw new NotFoundException("POI not found");
  }

  /** Radius search around a point — used by map "near me" style queries. */
  async radiusSearch(query: RadiusQuery): Promise<Poi[]> {
    const qb = this.poisRepository
      .createQueryBuilder("poi")
      .where("poi.status = :status", { status: PoiStatus.APPROVED })
      .andWhere(
        "ST_DWithin(poi.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)",
        { lng: query.lng, lat: query.lat, radius: query.radiusMeters },
      );

    this.applyCategoryFilter(qb, query.categoryId);
    if (query.openNow) qb.andWhere(OPEN_NOW_SQL);

    const pois = await qb
      .orderBy("ST_Distance(poi.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)", "ASC")
      .limit(query.limit)
      .getMany();
    return this.toDtoList(pois);
  }

  /** Nearest POI(s) via the GiST index's KNN (`<->`) operator. */
  async nearestSearch(query: NearestQuery): Promise<Poi[]> {
    const qb = this.poisRepository
      .createQueryBuilder("poi")
      .where("poi.status = :status", { status: PoiStatus.APPROVED })
      .setParameters({ lng: query.lng, lat: query.lat });

    this.applyCategoryFilter(qb, query.categoryId);
    if (query.openNow) qb.andWhere(OPEN_NOW_SQL);

    const pois = await qb
      .orderBy("poi.location <-> ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography", "ASC")
      .limit(query.limit)
      .getMany();
    return this.toDtoList(pois);
  }

  /** Map-viewport search: POIs whose location falls inside the given bounding box. */
  async bboxSearch(query: BboxQuery): Promise<Poi[]> {
    const qb = this.poisRepository
      .createQueryBuilder("poi")
      .where("poi.status = :status", { status: PoiStatus.APPROVED })
      .andWhere(
        "ST_Intersects(poi.location::geometry, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326))",
        { minLng: query.minLng, minLat: query.minLat, maxLng: query.maxLng, maxLat: query.maxLat },
      );

    this.applyCategoryFilter(qb, query.categoryId);
    if (query.openNow) qb.andWhere(OPEN_NOW_SQL);

    const pois = await qb.limit(query.limit).getMany();
    return this.toDtoList(pois);
  }

  private applyCategoryFilter(
    qb: import("typeorm").SelectQueryBuilder<PoiEntity>,
    categoryId: string | undefined,
  ): void {
    if (!categoryId) return;
    qb.andWhere(
      "EXISTS (SELECT 1 FROM poi_categories pc WHERE pc.poi_id = poi.id AND pc.category_id = :categoryId)",
      { categoryId },
    );
  }

  private async categoryInfoFor(poiIds: string[]): Promise<Map<string, PoiCategoryInfo>> {
    if (poiIds.length === 0) return new Map();
    const rows = await this.poiCategoriesRepository.find({ where: { poiId: In(poiIds) } });
    const map = new Map<string, PoiCategoryInfo>();
    for (const row of rows) {
      const entry = map.get(row.poiId) ?? { categoryIds: [], primaryCategoryId: "" };
      entry.categoryIds.push(row.categoryId);
      if (row.isPrimary) entry.primaryCategoryId = row.categoryId;
      map.set(row.poiId, entry);
    }
    return map;
  }

  private async toDtoList(pois: PoiEntity[]): Promise<Poi[]> {
    const infoMap = await this.categoryInfoFor(pois.map((p) => p.id));
    return pois.map((poi) =>
      toPoiDto(poi, infoMap.get(poi.id) ?? { categoryIds: [], primaryCategoryId: "" }),
    );
  }

  private async toDto(poi: PoiEntity): Promise<Poi> {
    const infoMap = await this.categoryInfoFor([poi.id]);
    return toPoiDto(poi, infoMap.get(poi.id) ?? { categoryIds: [], primaryCategoryId: "" });
  }

  private async getDto(id: string): Promise<Poi> {
    const poi = await this.poisRepository.findOne({ where: { id } });
    if (!poi) throw new NotFoundException("POI not found");
    return this.toDto(poi);
  }

  private async runWrite<T>(fn: (manager: EntityManager) => Promise<T>): Promise<T> {
    try {
      return await this.dataSource.transaction(fn);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as unknown as { code?: string }).code === FOREIGN_KEY_VIOLATION
      ) {
        throw new BadRequestException("Invalid categoryId(s) or cityId");
      }
      throw error;
    }
  }
}
