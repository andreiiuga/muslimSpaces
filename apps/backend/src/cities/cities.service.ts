import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { CreateCityPayload } from "@muslimspaces/shared";
import { CityEntity } from "./entities/city.entity";

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(CityEntity)
    private readonly citiesRepository: Repository<CityEntity>,
  ) {}

  findAll(): Promise<CityEntity[]> {
    return this.citiesRepository.find({ order: { slug: "ASC" } });
  }

  async findByIdOrThrow(id: string): Promise<CityEntity> {
    const city = await this.citiesRepository.findOne({ where: { id } });
    if (!city) throw new NotFoundException("City not found");
    return city;
  }

  create(payload: CreateCityPayload): Promise<CityEntity> {
    const city = this.citiesRepository.create(payload);
    return this.citiesRepository.save(city);
  }
}
