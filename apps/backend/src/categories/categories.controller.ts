import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { createCategorySchema, updateCategorySchema } from "@muslimspaces/shared";
import type { CreateCategoryPayload, UpdateCategoryPayload } from "@muslimspaces/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CategoriesService } from "./categories.service";
import { toCategoryDto } from "./category.mapper";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async list() {
    const categories = await this.categoriesService.findAll();
    return categories.map(toCategoryDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async create(@Body(new ZodValidationPipe(createCategorySchema)) body: CreateCategoryPayload) {
    const category = await this.categoriesService.create(body);
    return toCategoryDto(category);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) body: UpdateCategoryPayload,
  ) {
    const category = await this.categoriesService.update(id, body);
    return toCategoryDto(category);
  }
}
