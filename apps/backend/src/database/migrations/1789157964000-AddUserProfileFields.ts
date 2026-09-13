import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserProfileFields1789157964000 implements MigrationInterface {
  name = "AddUserProfileFields1789157964000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "display_name" varchar,
        ADD COLUMN "avatar_key" varchar;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "avatar_key",
        DROP COLUMN "display_name";
    `);
  }
}
