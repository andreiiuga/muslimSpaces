import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { LocalizedText } from "../../common/localized-text";
import { GeoPoint } from "../../common/geo-point";
import { CategoryEntity } from "../../categories/entities/category.entity";
import { CityEntity } from "../../cities/entities/city.entity";
import { UserEntity } from "../../users/entities/user.entity";

export enum PoiStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

@Entity("pois")
export class PoiEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "jsonb" })
  name: LocalizedText;

  @Column({ type: "jsonb", nullable: true })
  description: LocalizedText | null;

  @Column({ name: "category_id" })
  categoryId: string;

  @ManyToOne(() => CategoryEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "category_id" })
  category: CategoryEntity;

  @Column({ type: "uuid", name: "city_id", nullable: true })
  cityId: string | null;

  @ManyToOne(() => CityEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "city_id" })
  city: CityEntity | null;

  // GiST index created explicitly in migration SQL (see CreatePois migration)
  // rather than via `@Index({ spatial: true })`, to keep full control over
  // the PostGIS-specific index definition.
  @Column({
    type: "geography",
    spatialFeatureType: "Point",
    srid: 4326,
  })
  location: GeoPoint;

  @Column()
  address: string;

  @Column({ type: "varchar", nullable: true })
  phone: string | null;

  @Column({ type: "varchar", nullable: true })
  website: string | null;

  @Column({ type: "varchar", name: "opening_hours", nullable: true })
  openingHours: string | null;

  @Index()
  @Column({ type: "enum", enum: PoiStatus, default: PoiStatus.PENDING })
  status: PoiStatus;

  @Column({ name: "submitted_by" })
  submittedById: string;

  @ManyToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "submitted_by" })
  submittedBy: UserEntity;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
