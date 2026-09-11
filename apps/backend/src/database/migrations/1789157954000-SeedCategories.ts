import { MigrationInterface, QueryRunner } from "typeorm";

const CATEGORIES: Array<{ slug: string; ro: string; en: string }> = [
  { slug: "mosque", ro: "Moschee", en: "Mosque" },
  { slug: "halal-restaurant", ro: "Restaurant halal", en: "Halal restaurant" },
  { slug: "islamic-school", ro: "Centru de invatare islamica", en: "Islamic learning center" },
  { slug: "healthcare", ro: "Sanatate", en: "Healthcare" },
  { slug: "other", ro: "Altele", en: "Other" },
];

export class SeedCategories1789157954000 implements MigrationInterface {
  name = "SeedCategories1789157954000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { slug, ro, en } of CATEGORIES) {
      await queryRunner.query(
        `INSERT INTO "categories" ("slug", "name") VALUES ($1, $2::jsonb)`,
        [slug, JSON.stringify({ ro, en })],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "categories" WHERE "slug" = ANY($1)`,
      [CATEGORIES.map((c) => c.slug)],
    );
  }
}
