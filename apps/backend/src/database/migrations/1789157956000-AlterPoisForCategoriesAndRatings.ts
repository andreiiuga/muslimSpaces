import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterPoisForCategoriesAndRatings1789157956000 implements MigrationInterface {
  name = "AlterPoisForCategoriesAndRatings1789157956000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Categories move to a many-to-many join (poi_categories, next migration)
    // since a POI can carry several (e.g. Mosque + Jamiah).
    await queryRunner.query(`ALTER TABLE "pois" DROP CONSTRAINT "FK_pois_category";`);
    await queryRunner.query(`DROP INDEX "IDX_pois_category_id";`);
    await queryRunner.query(`ALTER TABLE "pois" DROP COLUMN "category_id";`);

    // Free-text hours replaced by structured poi_hours (next migrations) —
    // needed for "open now" filtering.
    await queryRunner.query(`ALTER TABLE "pois" DROP COLUMN "opening_hours";`);

    // Denormalized from reviews, recomputed on every review write.
    await queryRunner.query(`
      ALTER TABLE "pois"
        ADD COLUMN "rating_avg" numeric(3,2),
        ADD COLUMN "rating_count" int NOT NULL DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pois"
        DROP COLUMN "rating_count",
        DROP COLUMN "rating_avg";
    `);
    await queryRunner.query(`ALTER TABLE "pois" ADD COLUMN "opening_hours" varchar;`);
    await queryRunner.query(`ALTER TABLE "pois" ADD COLUMN "category_id" uuid;`);
    await queryRunner.query(`
      CREATE INDEX "IDX_pois_category_id" ON "pois" ("category_id");
    `);
    await queryRunner.query(`
      ALTER TABLE "pois" ADD CONSTRAINT "FK_pois_category"
        FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT;
    `);
  }
}
