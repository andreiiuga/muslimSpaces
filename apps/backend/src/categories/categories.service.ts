import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { CreateCategoryPayload, UpdateCategoryPayload } from "@muslimspaces/shared";
import { CategoryEntity } from "./entities/category.entity";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,
  ) {}

  findAll(): Promise<CategoryEntity[]> {
    return this.categoriesRepository.find({ order: { slug: "ASC" } });
  }

  async findByIdOrThrow(id: string): Promise<CategoryEntity> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }

  create(payload: CreateCategoryPayload): Promise<CategoryEntity> {
    const category = this.categoriesRepository.create(payload);
    return this.categoriesRepository.save(category);
  }

  async update(id: string, payload: UpdateCategoryPayload): Promise<CategoryEntity> {
    const category = await this.findByIdOrThrow(id);
    Object.assign(category, payload);
    return this.categoriesRepository.save(category);
  }
}
