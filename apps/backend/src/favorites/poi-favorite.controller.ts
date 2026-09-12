import { Controller, Delete, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { FavoritesService } from "./favorites.service";

@Controller("pois/:poiId/favorite")
@UseGuards(JwtAuthGuard)
export class PoiFavoriteController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  add(@Param("poiId") poiId: string, @CurrentUser() user: RequestUser) {
    return this.favoritesService.add(user.userId, poiId);
  }

  @Delete()
  @HttpCode(204)
  remove(@Param("poiId") poiId: string, @CurrentUser() user: RequestUser) {
    return this.favoritesService.remove(user.userId, poiId);
  }
}
