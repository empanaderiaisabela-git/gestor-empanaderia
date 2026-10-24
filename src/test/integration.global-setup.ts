import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { assertTestDatabaseUrl } from './test-database-url';

const MIGRATIONS_FOLDER = './src/lib/db/migrations';
const CONNECTION_HINT = 'No se pudo conectar a db-test. Levantala con: docker compose up -d --wait db-test';

// Por qué: Vite 8 falla al mapear el stack de un error lanzado en el globalSetup y oculta el mensaje.
function readableError(message: string): Error {
  return Object.assign(new Error(message), { stack: `Error: ${message}` });
}

function guardedUrl(): string {
  try {
    return assertTestDatabaseUrl({ url: process.env.LOCAL_DATABASE_URL, nodeEnv: process.env.NODE_ENV });
  } catch (error) {
    throw readableError(error instanceof Error ? error.message : String(error));
  }
}

async function connectOrExplain(pool: Pool): Promise<void> {
  try {
    const client = await pool.connect();
    client.release();
  } catch {
    throw readableError(CONNECTION_HINT);
  }
}

export default async function setup(): Promise<void> {
  const pool = new Pool({ connectionString: guardedUrl() });
  try {
    await connectOrExplain(pool);
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await pool.end();
  }
}
