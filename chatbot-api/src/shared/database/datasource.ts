import * as path from 'path';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

// Load .env when executed directly by TypeORM CLI (no NestJS bootstrapping).
// process.cwd() is always chatbot-api/, regardless of compiled __dirname depth.
config({ path: path.join(process.cwd(), '.env') });

export function buildDataSourceOptions(): DataSourceOptions {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  return {
    type: 'postgres',
    url,
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    entities: [path.join(__dirname, '../../modules/**/*.entity{.ts,.js}')],
    migrations: [path.join(__dirname, '../../../migrations/*{.ts,.js}')],
    migrationsTableName: 'typeorm_migrations',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
}

// Used by TypeORM CLI
const AppDataSource = new DataSource(buildDataSourceOptions());
export default AppDataSource;
