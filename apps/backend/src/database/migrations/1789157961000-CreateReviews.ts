import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReviews1789157961000 implements MigrationInterface {
  name = "CreateReviews1789157961000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "reviews_status_enum" AS ENUM ('published', 'hidden');
    `);

    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "poi_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "rating" smallint NOT NULL,
        "comment" text,
        "status" "reviews_status_enum" NOT NULL DEFAULT 'published',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_reviews_rating" CHECK ("rating" BETWEEN 1 AND 5),
        CONSTRAINT "UQ_reviews_poi_user" UNIQUE ("poi_id", "user_id"),
        CONSTRAINT "FK_reviews_poi" FOREIGN KEY ("poi_id")
          REFERENCES "pois" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_reviews_poi_id" ON "reviews" ("poi_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "reviews";`);
    await queryRunner.query(`DROP TYPE "reviews_status_enum";`);
  }
}
