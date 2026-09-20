import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPoiVisibility1789157966000 implements MigrationInterface {
  name = "AddPoiVisibility1789157966000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "pois_visibility_enum" AS ENUM ('visible', 'hidden');
    `);

    await queryRunner.query(`
      ALTER TABLE "pois"
        ADD COLUMN "visibility" "pois_visibility_enum" NOT NULL DEFAULT 'visible';
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_pois_visibility" ON "pois" ("visibility");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_pois_visibility";`);
    await queryRunner.query(`ALTER TABLE "pois" DROP COLUMN "visibility";`);
    await queryRunner.query(`DROP TYPE "pois_visibility_enum";`);
  }
}
