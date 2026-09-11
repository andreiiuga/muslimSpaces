import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePois1789157953000 implements MigrationInterface {
  name = "CreatePois1789157953000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "pois_status_enum" AS ENUM ('pending', 'approved', 'rejected');
    `);

    await queryRunner.query(`
      CREATE TABLE "pois" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" jsonb NOT NULL,
        "description" jsonb,
        "category_id" uuid NOT NULL,
        "city_id" uuid,
        "location" geography(Point, 4326) NOT NULL,
        "address" varchar NOT NULL,
        "phone" varchar,
        "website" varchar,
        "opening_hours" varchar,
        "status" "pois_status_enum" NOT NULL DEFAULT 'pending',
        "submitted_by" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_pois_category" FOREIGN KEY ("category_id")
          REFERENCES "categories" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_pois_city" FOREIGN KEY ("city_id")
          REFERENCES "cities" ("id") ON DELETE SET NULL,
        CONSTRAINT "FK_pois_submitted_by" FOREIGN KEY ("submitted_by")
          REFERENCES "users" ("id") ON DELETE RESTRICT
      );
    `);

    // GiST index is what makes ST_DWithin / ST_MakeEnvelope / KNN (<->)
    // queries fast instead of full table scans.
    await queryRunner.query(`
      CREATE INDEX "IDX_pois_location" ON "pois" USING GIST ("location");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_pois_category_id" ON "pois" ("category_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_pois_city_id" ON "pois" ("city_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_pois_status" ON "pois" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pois";`);
    await queryRunner.query(`DROP TYPE "pois_status_enum";`);
  }
}
