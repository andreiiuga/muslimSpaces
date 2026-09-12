import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PoisModule } from "../pois/pois.module";
import { FavoriteEntity } from "./entities/favorite.entity";
import { FavoritesService } from "./favorites.service";
import { FavoritesController } from "./favorites.controller";
import { PoiFavoriteController } from "./poi-favorite.controller";

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteEntity]), PoisModule],
  controllers: [FavoritesController, PoiFavoriteController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
