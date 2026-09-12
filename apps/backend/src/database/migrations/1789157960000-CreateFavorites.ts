import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFavorites1789157960000 implements MigrationInterface {
  name = "CreateFavorites1789157960000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "favorites" (
        "user_id" uuid NOT NULL,
        "poi_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("user_id", "poi_id"),
        CONSTRAINT "FK_favorites_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_favorites_poi" FOREIGN KEY ("poi_id")
          REFERENCES "pois" ("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "favorites";`);
  }
}
