import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

/** True only when Cloud SQL / Postgres is explicitly configured for this process. */
export function isSqlConfigured(): boolean {
  return Boolean((process.env.SQL_HOST || '').trim());
}

let poolInstance: pg.Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

/** Lazily created so a missing SQL_HOST never turns into a localhost connection attempt. */
export function getPool(): pg.Pool {
  if (!poolInstance) {
    poolInstance = new pg.Pool({
      host: process.env.SQL_HOST,
      database: process.env.SQL_DB_NAME,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      port: 5432,
    });
  }
  return poolInstance;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema });
  }
  return dbInstance;
}

export { schema };
