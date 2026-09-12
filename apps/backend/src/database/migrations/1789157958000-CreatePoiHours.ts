import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePoiHours1789157958000 implements MigrationInterface {
  name = "CreatePoiHours1789157958000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "poi_hours" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "poi_id" uuid NOT NULL,
        "day_of_week" smallint NOT NULL,
        "opens_at" time NOT NULL,
        "closes_at" time NOT NULL,
        CONSTRAINT "FK_poi_hours_poi" FOREIGN KEY ("poi_id")
          REFERENCES "pois" ("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_poi_hours_day_of_week" CHECK ("day_of_week" BETWEEN 1 AND 7)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_poi_hours_poi_id" ON "poi_hours" ("poi_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "poi_hours";`);
  }
}
