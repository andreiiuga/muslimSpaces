import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import type { Favorite } from "@muslimspaces/shared";
import { FavoriteEntity } from "./entities/favorite.entity";

const FOREIGN_KEY_VIOLATION = "23503";

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoritesRepository: Repository<FavoriteEntity>,
  ) {}

  async add(userId: string, poiId: string): Promise<Favorite> {
    const existing = await this.favoritesRepository.findOne({ where: { userId, poiId } });
    if (existing) return { poiId, createdAt: existing.createdAt.toISOString() };

    try {
      const favorite = await this.favoritesRepository.save(
        this.favoritesRepository.create({ userId, poiId }),
      );
      return { poiId, createdAt: favorite.createdAt.toISOString() };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as unknown as { code?: string }).code === FOREIGN_KEY_VIOLATION
      ) {
        throw new BadRequestException("Invalid poiId");
      }
      throw error;
    }
  }

  async remove(userId: string, poiId: string): Promise<void> {
    await this.favoritesRepository.delete({ userId, poiId });
  }

  async listPoiIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.favoritesRepository.find({ where: { userId } });
    return rows.map((r) => r.poiId);
  }
}
