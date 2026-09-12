import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserPreferredLocale1789157955000 implements MigrationInterface {
  name = "AddUserPreferredLocale1789157955000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "preferred_locale" varchar NOT NULL DEFAULT 'ro';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "preferred_locale";`);
  }
}
