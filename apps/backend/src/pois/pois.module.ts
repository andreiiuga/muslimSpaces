import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MediaModule } from "../media/media.module";
import { PoiEntity } from "./entities/poi.entity";
import { PoiCategoryAssignmentEntity } from "./entities/poi-category-assignment.entity";
import { PoiHourEntity } from "./entities/poi-hour.entity";
import { PoiImageEntity } from "./entities/poi-image.entity";
import { PoisService } from "./pois.service";
import { PoisController } from "./pois.controller";
import { PoiHoursService } from "./poi-hours.service";
import { PoiHoursController } from "./poi-hours.controller";
import { PoiImagesService } from "./poi-images.service";
import { PoiImagesController } from "./poi-images.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([PoiEntity, PoiCategoryAssignmentEntity, PoiHourEntity, PoiImageEntity]),
    MediaModule,
  ],
  controllers: [PoisController, PoiHoursController, PoiImagesController],
  providers: [PoisService, PoiHoursService, PoiImagesService],
  exports: [PoisService],
})
export class PoisModule {}
