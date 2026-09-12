import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { UserEntity } from "../../users/entities/user.entity";
import { PoiEntity } from "../../pois/entities/poi.entity";

@Entity("favorites")
export class FavoriteEntity {
  @PrimaryColumn({ name: "user_id" })
  userId: string;

  @PrimaryColumn({ name: "poi_id" })
  poiId: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @ManyToOne(() => PoiEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "poi_id" })
  poi: PoiEntity;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
