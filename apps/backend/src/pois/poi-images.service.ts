import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import type { AttachPoiImagePayload, PoiImage, ReorderPoiImagesPayload } from "@muslimspaces/shared";
import type { RequestUser } from "../auth/decorators/current-user.decorator";
import { MediaService } from "../media/media.service";
import { PoiEntity } from "./entities/poi.entity";
import { PoiImageEntity, PoiImageRole } from "./entities/poi-image.entity";

@Injectable()
export class PoiImagesService {
  constructor(
    @InjectRepository(PoiImageEntity)
    private readonly poiImagesRepository: Repository<PoiImageEntity>,
    @InjectRepository(PoiEntity)
    private readonly poisRepository: Repository<PoiEntity>,
    private readonly mediaService: MediaService,
  ) {}

  async list(poiId: string): Promise<PoiImage[]> {
    const rows = await this.poiImagesRepository.find({
      where: { poiId },
      order: { sortOrder: "ASC" },
    });
    return rows.map((r) => this.toDto(r));
  }

  async attach(poiId: string, payload: AttachPoiImagePayload, user: RequestUser): Promise<PoiImage> {
    await this.assertCanEdit(poiId, user);
    const image = this.poiImagesRepository.create({
      poiId,
      role: payload.role as PoiImageRole,
      storageKey: payload.storageKey,
      sortOrder: payload.sortOrder,
    });
    const saved = await this.poiImagesRepository.save(image);
    return this.toDto(saved);
  }

  async remove(poiId: string, imageId: string, user: RequestUser): Promise<void> {
    await this.assertCanEdit(poiId, user);
    await this.poiImagesRepository.delete({ id: imageId, poiId });
  }

  // Full replacement order — sortOrder becomes each id's position in the
  // given array. Validates every id actually belongs to this POI first, so
  // a stale client-side list can't touch another POI's images.
  async reorder(poiId: string, payload: ReorderPoiImagesPayload, user: RequestUser): Promise<PoiImage[]> {
    await this.assertCanEdit(poiId, user);

    const existing = await this.poiImagesRepository.find({ where: { poiId, id: In(payload.imageIds) } });
    if (existing.length !== payload.imageIds.length) {
      throw new BadRequestException("imageIds must all belong to this POI");
    }

    const byId = new Map(existing.map((image) => [image.id, image]));
    const reordered = payload.imageIds.map((id, index) => {
      const image = byId.get(id)!;
      image.sortOrder = index;
      return image;
    });
    const saved = await this.poiImagesRepository.save(reordered);
    return saved.sort((a, b) => a.sortOrder - b.sortOrder).map((image) => this.toDto(image));
  }

  private async assertCanEdit(poiId: string, user: RequestUser): Promise<void> {
    const poi = await this.poisRepository.findOne({ where: { id: poiId } });
    if (!poi) throw new NotFoundException("POI not found");
    const isModerator = user.role === "moderator" || user.role === "admin";
    if (!isModerator && poi.submittedById !== user.userId) {
      throw new ForbiddenException("Not allowed to edit this POI's images");
    }
  }

  private toDto(entity: PoiImageEntity): PoiImage {
    const urls = this.mediaService.urlsForKey(entity.storageKey);
    return {
      id: entity.id,
      role: entity.role,
      url: urls.url,
      thumbnailUrl: urls.thumbnailUrl,
      sortOrder: entity.sortOrder,
    };
  }
}
