import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const pool = new pg.Pool({
  host: process.env.SQL_HOST,
  database: process.env.SQL_DB_NAME,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  port: 5432,
});

export const db = drizzle(pool, { schema });
export { pool };
export * as schema from './schema';
