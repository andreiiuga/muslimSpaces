import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { setPoiHoursSchema } from "@muslimspaces/shared";
import type { SetPoiHoursPayload } from "@muslimspaces/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";
import { PoiHoursService } from "./poi-hours.service";

@Controller("pois/:poiId/hours")
export class PoiHoursController {
  constructor(private readonly poiHoursService: PoiHoursService) {}

  @Get()
  list(@Param("poiId") poiId: string) {
    return this.poiHoursService.list(poiId);
  }

  // Replace-all semantics — see setPoiHoursSchema in packages/shared.
  @Put()
  @UseGuards(JwtAuthGuard)
  set(
    @Param("poiId") poiId: string,
    @Body(new ZodValidationPipe(setPoiHoursSchema)) body: SetPoiHoursPayload,
    @CurrentUser() user: RequestUser,
  ) {
    return this.poiHoursService.setHours(poiId, body, user);
  }
}
