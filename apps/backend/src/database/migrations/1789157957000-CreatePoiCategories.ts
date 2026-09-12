import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePoiCategories1789157957000 implements MigrationInterface {
  name = "CreatePoiCategories1789157957000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "poi_categories" (
        "poi_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "is_primary" boolean NOT NULL DEFAULT false,
        PRIMARY KEY ("poi_id", "category_id"),
        CONSTRAINT "FK_poi_categories_poi" FOREIGN KEY ("poi_id")
          REFERENCES "pois" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_poi_categories_category" FOREIGN KEY ("category_id")
          REFERENCES "categories" ("id") ON DELETE RESTRICT
      );
    `);

    // Enforces "exactly one primary category per POI" at the DB level —
    // no separate primaryCategoryId column that could drift out of sync.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_poi_categories_one_primary"
        ON "poi_categories" ("poi_id") WHERE "is_primary" = true;
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_poi_categories_category_id" ON "poi_categories" ("category_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "poi_categories";`);
  }
}
