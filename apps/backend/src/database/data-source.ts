import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/migrations/*{.ts,.js}"],
  // Schema is managed exclusively through migrations, never auto-sync —
  // PostGIS columns/indexes need hand-written SQL that synchronize can't generate.
  synchronize: false,
};

// Used both by Nest's TypeOrmModule and by the `typeorm` CLI for migrations.
// The CLI requires exactly one DataSource export from this file.
export default new DataSource(dataSourceOptions);
