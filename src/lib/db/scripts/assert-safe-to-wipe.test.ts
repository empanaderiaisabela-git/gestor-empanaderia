import { describe, expect, it } from 'vitest';
import { assertSafeToWipe } from './assert-safe-to-wipe';

const DEV_URL = 'postgresql://postgres:password@127.0.0.1:5433/stock_db';
const TEST_URL = 'postgresql://postgres:password@localhost:5434/stock_test';
const SUPABASE_URL = 'postgresql://postgres.x:clave@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

describe('assertSafeToWipe', () => {
  it.each([
    ['la base de desarrollo', DEV_URL],
    ['la base de tests', TEST_URL],
  ])('permite borrar %s', (_caso, url) => {
    expect(() => assertSafeToWipe({ LOCAL_DATABASE_URL: url })).not.toThrow();
  });

  it('regression BUG-3: se niega a borrar con APP_ENV=production', () => {
    const env = { APP_ENV: 'production', DATABASE_URL: SUPABASE_URL, LOCAL_DATABASE_URL: DEV_URL };
    expect(() => assertSafeToWipe(env)).toThrow('Script destructivo bloqueado: APP_ENV=production apunta a la base de producción.');
  });

  it('regression BUG-3: se niega a borrar una base que no es local', () => {
    expect(() => assertSafeToWipe({ LOCAL_DATABASE_URL: SUPABASE_URL })).toThrow('Script destructivo bloqueado: la base no es local (aws-0-sa-east-1.pooler.supabase.com).');
  });

  it('se niega a borrar si la URL no se puede interpretar', () => {
    expect(() => assertSafeToWipe({ LOCAL_DATABASE_URL: 'no-es-una-url' })).toThrow('Script destructivo bloqueado: la URL de la base no es válida.');
  });

  it('se niega a borrar si falta la URL de la base', () => {
    expect(() => assertSafeToWipe({})).toThrow('Falta la variable de entorno LOCAL_DATABASE_URL.');
  });
});
