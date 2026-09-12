import { MigrationInterface, QueryRunner } from "typeorm";

const OLD_SLUGS = ["mosque", "halal-restaurant", "islamic-school", "healthcare", "other"];

const NEW_CATEGORIES: Array<{ slug: string; ro: string; en: string }> = [
  { slug: "jamiah", ro: "Jamiah", en: "Jamiah" },
  { slug: "mosque", ro: "Moschee", en: "Mosque" },
  { slug: "musallah", ro: "Musallah", en: "Musallah" },
  { slug: "restaurant", ro: "Restaurant", en: "Restaurant" },
  { slug: "convenience-store", ro: "Magazin mixt", en: "Convenience Store" },
  { slug: "meat-shop", ro: "Macelarie", en: "Meat Shop" },
  { slug: "sweets", ro: "Dulciuri", en: "Sweets" },
  { slug: "clothing", ro: "Imbracaminte", en: "Clothing" },
  { slug: "doctors", ro: "Doctori", en: "Doctors" },
  { slug: "lawyers", ro: "Avocati", en: "Lawyers" },
  { slug: "general-business", ro: "Afaceri generale", en: "General Business" },
];

export class ReseedCategories1789157963000 implements MigrationInterface {
  name = "ReseedCategories1789157963000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Safe to hard-delete: any POI-category links referencing these rows
    // live in poi_categories (created after AlterPoisForCategoriesAndRatings
    // dropped the old single-column FK), so there's nothing left pointing
    // at the old rows in this fresh schema.
    await queryRunner.query(`DELETE FROM "categories" WHERE "slug" = ANY($1)`, [OLD_SLUGS]);

    for (const { slug, ro, en } of NEW_CATEGORIES) {
      await queryRunner.query(
        `INSERT INTO "categories" ("slug", "name") VALUES ($1, $2::jsonb)`,
        [slug, JSON.stringify({ ro, en })],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "categories" WHERE "slug" = ANY($1)`,
      [NEW_CATEGORIES.map((c) => c.slug)],
    );
    for (const slug of OLD_SLUGS) {
      // best-effort revert; names beyond slug aren't preserved here
      await queryRunner.query(
        `INSERT INTO "categories" ("slug", "name") VALUES ($1, $2::jsonb) ON CONFLICT DO NOTHING`,
        [slug, JSON.stringify({ ro: slug, en: slug })],
      );
    }
  }
}
