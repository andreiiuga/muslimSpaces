import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { PoisService } from "../pois/pois.service";
import { FavoritesService } from "./favorites.service";

@Controller("favorites")
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(
    private readonly favoritesService: FavoritesService,
    private readonly poisService: PoisService,
  ) {}

  @Get("mine")
  async mine(@CurrentUser() user: RequestUser) {
    const poiIds = await this.favoritesService.listPoiIdsForUser(user.userId);
    return this.poisService.getManyByIds(poiIds);
  }
}
