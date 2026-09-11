import { MigrationInterface, QueryRunner } from "typeorm";

export class EnablePostgis1789157949000 implements MigrationInterface {
  name = "EnablePostgis1789157949000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    // Needed for gen_random_uuid() used as the default for every PK below.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Never drop postgis here — other migrations' geography columns depend
    // on it and dropping it would cascade-drop those columns.
  }
}
