import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { envFileFor, resolveDatabaseConfig } from './src/lib/db/database-config';

dotenv.config({ path: envFileFor(process.env) });

export default defineConfig({
  schema: ['./src/lib/db/schema.ts', './src/lib/db/menu-schema.ts'],
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: resolveDatabaseConfig(process.env).url,
  },
  verbose: true,
  strict: true,
});
