import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import type {
  BboxQuery,
  CreatePoiPayload,
  ListPoisQuery,
  ModeratePoiPayload,
  NearestQuery,
  RadiusQuery,
  UpdatePoiPayload,
} from "@muslimspaces/shared";
import { toGeoPoint } from "../common/geo-point";
import type { RequestUser } from "../auth/decorators/current-user.decorator";
import { PoiEntity, PoiStatus } from "./entities/poi.entity";

const FOREIGN_KEY_VIOLATION = "23503";

@Injectable()
export class PoisService {
  constructor(
    @InjectRepository(PoiEntity)
    private readonly poisRepository: Repository<PoiEntity>,
  ) {}

  async listApproved(query: ListPoisQuery): Promise<PoiEntity[]> {
    const qb = this.poisRepository
      .createQueryBuilder("poi")
      .where("poi.status = :status", { status: PoiStatus.APPROVED });

    if (query.categoryId) qb.andWhere("poi.category_id = :categoryId", { categoryId: query.categoryId });
    if (query.cityId) qb.andWhere("poi.city_id = :cityId", { cityId: query.cityId });

    return qb
      .orderBy("poi.created_at", "DESC")
      .limit(query.limit)
      .offset(query.offset)
      .getMany();
  }

  listPending(): Promise<PoiEntity[]> {
    return this.poisRepository.find({
      where: { status: PoiStatus.PENDING },
      order: { createdAt: "ASC" },
    });
  }

  async findApprovedByIdOrThrow(id: string): Promise<PoiEntity> {
    const poi = await this.poisRepository.findOne({
      where: { id, status: PoiStatus.APPROVED },
    });
    if (!poi) throw new NotFoundException("POI not found");
    return poi;
  }

  async findByIdOrThrow(id: string): Promise<PoiEntity> {
    const poi = await this.poisRepository.findOne({ where: { id } });
    if (!poi) throw new NotFoundException("POI not found");
    return poi;
  }

  async create(payload: CreatePoiPayload, submittedById: string): Promise<PoiEntity> {
    const poi = this.poisRepository.create({
      name: payload.name,
      description: payload.description ?? null,
      categoryId: payload.categoryId,
      cityId: payload.cityId ?? null,
      location: toGeoPoint(payload.location.lat, payload.location.lng),
      address: payload.address,
      phone: payload.phone ?? null,
      website: payload.website ?? null,
      openingHours: payload.openingHours ?? null,
      submittedById,
    });

    return this.saveOrThrowBadRequest(poi);
  }

  async update(id: string, payload: UpdatePoiPayload, currentUser: RequestUser): Promise<PoiEntity> {
    const poi = await this.findByIdOrThrow(id);

    const isModerator = currentUser.role === "moderator" || currentUser.role === "admin";
    const isOwnerOfPending = poi.submittedById === currentUser.userId && poi.status === PoiStatus.PENDING;
    if (!isModerator && !isOwnerOfPending) {
      throw new ForbiddenException("Not allowed to edit this POI");
    }

    if (payload.name !== undefined) poi.name = payload.name;
    if (payload.description !== undefined) poi.description = payload.description ?? null;
    if (payload.categoryId !== undefined) poi.categoryId = payload.categoryId;
    if (payload.cityId !== undefined) poi.cityId = payload.cityId ?? null;
    if (payload.location !== undefined) poi.location = toGeoPoint(payload.location.lat, payload.location.lng);
    if (payload.address !== undefined) poi.address = payload.address;
    if (payload.phone !== undefined) poi.phone = payload.phone ?? null;
    if (payload.website !== undefined) poi.website = payload.website ?? null;
    if (payload.openingHours !== undefined) poi.openingHours = payload.openingHours ?? null;

    return this.saveOrThrowBadRequest(poi);
  }

  async moderate(id: string, payload: ModeratePoiPayload): Promise<PoiEntity> {
    const poi = await this.findByIdOrThrow(id);
    poi.status = payload.status === "approved" ? PoiStatus.APPROVED : PoiStatus.REJECTED;
    return this.poisRepository.save(poi);
  }

  /** Radius search around a point — used by map "near me" style queries. */
  radiusSearch(query: RadiusQuery): Promise<PoiEntity[]> {
    const qb = this.poisRepository
      .createQueryBuilder("poi")
      .where("poi.status = :status", { status: PoiStatus.APPROVED })
      .andWhere(
        "ST_DWithin(poi.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)",
        { lng: query.lng, lat: query.lat, radius: query.radiusMeters },
      );

    if (query.categoryId) qb.andWhere("poi.category_id = :categoryId", { categoryId: query.categoryId });

    return qb
      .orderBy("ST_Distance(poi.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)", "ASC")
      .limit(query.limit)
      .getMany();
  }

  /** Nearest POI(s) via the GiST index's KNN (`<->`) operator. */
  nearestSearch(query: NearestQuery): Promise<PoiEntity[]> {
    const qb = this.poisRepository
      .createQueryBuilder("poi")
      .where("poi.status = :status", { status: PoiStatus.APPROVED })
      .setParameters({ lng: query.lng, lat: query.lat });

    if (query.categoryId) qb.andWhere("poi.category_id = :categoryId", { categoryId: query.categoryId });

    return qb
      .orderBy("poi.location <-> ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography", "ASC")
      .limit(query.limit)
      .getMany();
  }

  /** Map-viewport search: POIs whose location falls inside the given bounding box. */
  bboxSearch(query: BboxQuery): Promise<PoiEntity[]> {
    const qb = this.poisRepository
      .createQueryBuilder("poi")
      .where("poi.status = :status", { status: PoiStatus.APPROVED })
      .andWhere(
        "ST_Intersects(poi.location::geometry, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326))",
        { minLng: query.minLng, minLat: query.minLat, maxLng: query.maxLng, maxLat: query.maxLat },
      );

    if (query.categoryId) qb.andWhere("poi.category_id = :categoryId", { categoryId: query.categoryId });

    return qb.limit(query.limit).getMany();
  }

  private async saveOrThrowBadRequest(poi: PoiEntity): Promise<PoiEntity> {
    try {
      return await this.poisRepository.save(poi);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as unknown as { code?: string }).code === FOREIGN_KEY_VIOLATION
      ) {
        throw new BadRequestException("Invalid categoryId or cityId");
      }
      throw error;
    }
  }
}
