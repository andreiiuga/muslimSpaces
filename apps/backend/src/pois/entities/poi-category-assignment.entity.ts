import { Entity, JoinColumn, ManyToOne, PrimaryColumn, Column } from "typeorm";
import { PoiEntity } from "./poi.entity";
import { CategoryEntity } from "../../categories/entities/category.entity";

// Many-to-many with a designated primary: a POI can carry several
// categories (a mosque that's also a Jamiah), but exactly one is the
// "headline" category for quick-glance labels / map pin icons / SEO
// category routing. Enforced via a partial unique index in the migration
// (UNIQUE (poi_id) WHERE is_primary), not just app logic.
@Entity("poi_categories")
export class PoiCategoryAssignmentEntity {
  @PrimaryColumn({ name: "poi_id" })
  poiId: string;

  @PrimaryColumn({ name: "category_id" })
  categoryId: string;

  @Column({ name: "is_primary", default: false })
  isPrimary: boolean;

  @ManyToOne(() => PoiEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "poi_id" })
  poi: PoiEntity;

  @ManyToOne(() => CategoryEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "category_id" })
  category: CategoryEntity;
}
