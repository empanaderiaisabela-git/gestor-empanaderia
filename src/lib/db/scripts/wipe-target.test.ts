import { describe, expect, it } from 'vitest';
import { wipeTargetUrl } from './wipe-target';

const DEV_URL = 'postgresql://postgres:password@127.0.0.1:5433/stock_db';
const SUPABASE_URL = 'postgresql://postgres.x:clave@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

describe('wipeTargetUrl (wipe-db.ts)', () => {
  it('devuelve la URL de la base local que se va a borrar', () => {
    expect(wipeTargetUrl({ LOCAL_DATABASE_URL: DEV_URL })).toBe(DEV_URL);
  });

  it('regression BUG-10: se niega a borrar con APP_ENV=production', () => {
    const env = { APP_ENV: 'production', DATABASE_URL: SUPABASE_URL, LOCAL_DATABASE_URL: DEV_URL };
    expect(() => wipeTargetUrl(env)).toThrow('Script destructivo bloqueado: APP_ENV=production apunta a la base de producción.');
  });

  it('regression BUG-10: se niega a borrar una base remota', () => {
    expect(() => wipeTargetUrl({ LOCAL_DATABASE_URL: SUPABASE_URL })).toThrow('Script destructivo bloqueado: la base no es local');
  });
});
