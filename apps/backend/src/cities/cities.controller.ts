import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { createCitySchema } from "@muslimspaces/shared";
import type { CreateCityPayload } from "@muslimspaces/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CitiesService } from "./cities.service";
import { toCityDto } from "./city.mapper";

@Controller("cities")
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  async list() {
    const cities = await this.citiesService.findAll();
    return cities.map(toCityDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async create(@Body(new ZodValidationPipe(createCitySchema)) body: CreateCityPayload) {
    const city = await this.citiesService.create(body);
    return toCityDto(city);
  }
}
