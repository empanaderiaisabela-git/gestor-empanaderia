import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schema';
import { envFileFor, resolveDatabaseConfig } from './database-config';
import { sqlOnlyLogger } from './query-logger';

dotenv.config({ path: envFileFor(process.env) });

const config = resolveDatabaseConfig(process.env);

const pool = new Pool({
  connectionString: config.url,
  ssl: config.ssl ? { rejectUnauthorized: false } : false,
  max: config.maxConnections,
});

export const db = drizzle(pool, { schema, logger: config.logQueries ? sqlOnlyLogger : false });
