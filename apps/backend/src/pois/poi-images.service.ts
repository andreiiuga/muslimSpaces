import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import type { AttachPoiImagePayload, PoiImage, ReorderPoiImagesPayload, SetPoiImageRolesPayload } from "@muslimspaces/shared";
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
      order: { sortOrder: "ASC", id: "ASC" },
    });
    return this.group(rows);
  }

  // Attaching a storage key this POI already has just adds a role to that
  // image (no duplicate image entry) — the same upload can be cover, logo
  // and gallery at once.
  async attach(poiId: string, payload: AttachPoiImagePayload, user: RequestUser): Promise<PoiImage> {
    await this.assertCanEdit(poiId, user);
    const siblings = await this.poiImagesRepository.find({ where: { poiId, storageKey: payload.storageKey } });
    const role = payload.role as PoiImageRole;
    if (!siblings.some((r) => r.role === role)) {
      await this.poiImagesRepository.save(
        this.poiImagesRepository.create({
          poiId,
          role,
          storageKey: payload.storageKey,
          sortOrder: siblings[0]?.sortOrder ?? payload.sortOrder,
        }),
      );
    }
    return this.groupFor(poiId, payload.storageKey);
  }

  // Replaces the image's full role set: missing roles are removed, new ones
  // added. Applies to every row sharing the image's storage key.
  async setRoles(poiId: string, imageId: string, payload: SetPoiImageRolesPayload, user: RequestUser): Promise<PoiImage> {
    await this.assertCanEdit(poiId, user);
    const anchor = await this.poiImagesRepository.findOne({ where: { id: imageId, poiId } });
    if (!anchor) throw new NotFoundException("Image not found");

    const rows = await this.poiImagesRepository.find({ where: { poiId, storageKey: anchor.storageKey } });
    const wanted = new Set(payload.roles as PoiImageRole[]);
    const toRemove = rows.filter((r) => !wanted.has(r.role));
    const have = new Set(rows.map((r) => r.role));
    const toAdd = [...wanted].filter((role) => !have.has(role));

    if (toRemove.length) await this.poiImagesRepository.remove(toRemove);
    if (toAdd.length) {
      await this.poiImagesRepository.save(
        toAdd.map((role) =>
          this.poiImagesRepository.create({ poiId, role, storageKey: anchor.storageKey, sortOrder: anchor.sortOrder }),
        ),
      );
    }
    return this.groupFor(poiId, anchor.storageKey);
  }

  // Deletes the whole image — every role row sharing its storage key.
  async remove(poiId: string, imageId: string, user: RequestUser): Promise<void> {
    await this.assertCanEdit(poiId, user);
    const anchor = await this.poiImagesRepository.findOne({ where: { id: imageId, poiId } });
    if (!anchor) return;
    await this.poiImagesRepository.delete({ poiId, storageKey: anchor.storageKey });
  }

  // Full replacement order, not a single-item move. `imageIds` are the
  // grouped images' ids (as returned by list); every row sharing a group's
  // storage key gets that group's new position. Validates every id actually
  // belongs to this POI first, so a stale client-side list can't touch
  // another POI's images.
  async reorder(poiId: string, payload: ReorderPoiImagesPayload, user: RequestUser): Promise<PoiImage[]> {
    await this.assertCanEdit(poiId, user);

    const anchors = await this.poiImagesRepository.find({ where: { poiId, id: In(payload.imageIds) } });
    if (anchors.length !== payload.imageIds.length) {
      throw new BadRequestException("imageIds must all belong to this POI");
    }

    const all = await this.poiImagesRepository.find({ where: { poiId } });
    const positionByKey = new Map<string, number>();
    const anchorById = new Map(anchors.map((a) => [a.id, a]));
    payload.imageIds.forEach((id, index) => positionByKey.set(anchorById.get(id)!.storageKey, index));

    for (const row of all) {
      const position = positionByKey.get(row.storageKey);
      if (position !== undefined) row.sortOrder = position;
    }
    await this.poiImagesRepository.save(all);
    return this.list(poiId);
  }

  private async groupFor(poiId: string, storageKey: string): Promise<PoiImage> {
    const rows = await this.poiImagesRepository.find({ where: { poiId, storageKey }, order: { id: "ASC" } });
    return this.group(rows)[0]!;
  }

  // One DTO per distinct storage key, ordered by sortOrder. `id` is the
  // group's lowest-id row so it stays stable across role edits unless that
  // specific row's role is removed (the client always re-reads the returned
  // DTO's id).
  private group(rows: PoiImageEntity[]): PoiImage[] {
    const groups = new Map<string, PoiImageEntity[]>();
    for (const row of rows) {
      const list = groups.get(row.storageKey) ?? [];
      list.push(row);
      groups.set(row.storageKey, list);
    }
    return [...groups.values()]
      .map((members) => {
        const sorted = [...members].sort((a, b) => (a.id < b.id ? -1 : 1));
        return this.toDto(sorted[0]!, sorted.map((m) => m.role));
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private async assertCanEdit(poiId: string, user: RequestUser): Promise<void> {
    const poi = await this.poisRepository.findOne({ where: { id: poiId } });
    if (!poi) throw new NotFoundException("POI not found");
    const isModerator = user.role === "moderator" || user.role === "admin";
    if (!isModerator && poi.submittedById !== user.userId) {
      throw new ForbiddenException("Not allowed to edit this POI's images");
    }
  }

  private toDto(entity: PoiImageEntity, roles: PoiImageRole[]): PoiImage {
    const urls = this.mediaService.urlsForKey(entity.storageKey);
    return {
      id: entity.id,
      roles,
      url: urls.url,
      thumbnailUrl: urls.thumbnailUrl,
      sortOrder: entity.sortOrder,
    };
  }
}
