import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PoiEntity } from "./poi.entity";

@Entity("poi_hours")
export class PoiHourEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "poi_id" })
  poiId: string;

  @ManyToOne(() => PoiEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "poi_id" })
  poi: PoiEntity;

  // ISO 8601: 1=Monday...7=Sunday, matches Postgres's EXTRACT(ISODOW FROM ...)
  @Column({ name: "day_of_week", type: "smallint" })
  dayOfWeek: number;

  @Column({ name: "opens_at", type: "time" })
  opensAt: string;

  @Column({ name: "closes_at", type: "time" })
  closesAt: string;
}
