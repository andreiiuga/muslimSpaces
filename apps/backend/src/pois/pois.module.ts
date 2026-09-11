import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PoiEntity } from "./entities/poi.entity";
import { PoisService } from "./pois.service";
import { PoisController } from "./pois.controller";

@Module({
  imports: [TypeOrmModule.forFeature([PoiEntity])],
  controllers: [PoisController],
  providers: [PoisService],
})
export class PoisModule {}
