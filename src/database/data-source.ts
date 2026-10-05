import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config({ quiet: true });

/**
 * Used by the TypeORM CLI for migrations (see the `migration:*` scripts in package.json).
 * The Nest app connects through TypeOrmModule in app.module.ts instead.
 *
 * Schema changes are never applied automatically: generate a migration, review it,
 * then run it against the database on purpose.
 */
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});
