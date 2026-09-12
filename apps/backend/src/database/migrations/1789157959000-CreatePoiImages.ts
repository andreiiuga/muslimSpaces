import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePoiImages1789157959000 implements MigrationInterface {
  name = "CreatePoiImages1789157959000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "poi_images_role_enum" AS ENUM ('logo', 'cover', 'gallery');
    `);

    await queryRunner.query(`
      CREATE TABLE "poi_images" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "poi_id" uuid NOT NULL,
        "role" "poi_images_role_enum" NOT NULL,
        "storage_key" varchar NOT NULL,
        "sort_order" int NOT NULL DEFAULT 0,
        CONSTRAINT "FK_poi_images_poi" FOREIGN KEY ("poi_id")
          REFERENCES "pois" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_poi_images_poi_id" ON "poi_images" ("poi_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "poi_images";`);
    await queryRunner.query(`DROP TYPE "poi_images_role_enum";`);
  }
}
