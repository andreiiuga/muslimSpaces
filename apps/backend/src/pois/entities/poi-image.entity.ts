import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PoiEntity } from "./poi.entity";

export enum PoiImageRole {
  LOGO = "logo",
  COVER = "cover",
  GALLERY = "gallery",
}

@Entity("poi_images")
export class PoiImageEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "poi_id" })
  poiId: string;

  @ManyToOne(() => PoiEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "poi_id" })
  poi: PoiEntity;

  @Column({ type: "enum", enum: PoiImageRole })
  role: PoiImageRole;

  // Content-hashed base key in the bucket, e.g. "poi/<hash>". The
  // thumbnail/display variants are derived suffixes — see MediaService.
  @Column({ name: "storage_key" })
  storageKey: string;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder: number;
}
