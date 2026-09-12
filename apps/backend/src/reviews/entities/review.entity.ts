import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "../../users/entities/user.entity";
import { PoiEntity } from "../../pois/entities/poi.entity";

export enum ReviewStatus {
  PUBLISHED = "published",
  HIDDEN = "hidden",
}

// UNIQUE (poi_id, user_id) in the migration: one review per user per POI —
// submitting again edits the existing row instead of creating a duplicate.
@Entity("reviews")
export class ReviewEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "poi_id" })
  poiId: string;

  @ManyToOne(() => PoiEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "poi_id" })
  poi: PoiEntity;

  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @Column({ type: "smallint" })
  rating: number;

  @Column({ type: "text", nullable: true })
  comment: string | null;

  @Column({ type: "enum", enum: ReviewStatus, default: ReviewStatus.PUBLISHED })
  status: ReviewStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
