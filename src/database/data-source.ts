import { config } from 'dotenv';
import { DataSource } from 'typeorm';

// .env.local overrides .env for local development.
config({ path: ['.env.local', '.env'], quiet: true });

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];
const host = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL).hostname
  : '';

// Block migrations on remote databases unless ALLOW_REMOTE_MIGRATIONS=yes.
if (
  host &&
  !LOCAL_HOSTS.includes(host) &&
  process.env.ALLOW_REMOTE_MIGRATIONS !== 'yes'
) {
  throw new Error(
    `Refusing to run migrations against remote database "${host}". ` +
      'Back it up first, then set ALLOW_REMOTE_MIGRATIONS=yes to continue.',
  );
}

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});
