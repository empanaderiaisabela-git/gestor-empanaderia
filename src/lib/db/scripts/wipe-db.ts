import * as dotenv from 'dotenv';
import pg from 'pg';
import { envFileFor } from '../database-config';
import { wipeTargetUrl } from './wipe-target';

dotenv.config({ path: envFileFor(process.env), quiet: true });

function targetOrExit(): string {
  try {
    return wipeTargetUrl(process.env);
  } catch (error) {
    console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function wipeDatabase() {
  const connectionString = targetOrExit();

  console.log('⚠️  ATENCIÓN: Se van a ELIMINAR TODAS las tablas de la base de datos LOCAL.');
  console.log('Conectando a:', connectionString.split('@')[1]);

  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Conectado.');

    console.log('🔥 Dropping schema public and drizzle...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE;');

    console.log('✨ Creating schema public...');
    await client.query('CREATE SCHEMA public;');

    console.log('🔑 Granting permissions...');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');

    console.log('✅ Base de datos reseteada con éxito.');
  } catch (err) {
    console.error('❌ Error durante el wipe:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

wipeDatabase();
