import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { TEST_DATABASE_URL, assertTestDatabaseUrl } from './test-database-url';

describe('assertTestDatabaseUrl', () => {
  it.each([
    ['postgresql://postgres:password@127.0.0.1:5434/stock_test'],
    ['postgresql://postgres:password@localhost:5434/stock_test'],
    ['postgres://otro:clave@127.0.0.1:5434/stock_test'],
  ])('acepta la base de tests %s', (url) => {
    expect(assertTestDatabaseUrl({ url, nodeEnv: 'test' })).toBe(url);
  });

  it.each([
    ['la base de desarrollo', 'postgresql://postgres:password@127.0.0.1:5433/stock_db'],
    ['otra base en el puerto de tests', 'postgresql://postgres:password@127.0.0.1:5434/stock_db'],
    ['otro puerto con la base de tests', 'postgresql://postgres:password@127.0.0.1:5432/stock_test'],
    ['un host remoto', 'postgresql://postgres:password@db.example.com:5434/stock_test'],
    ['Supabase', 'postgresql://postgres.x:clave@aws-0-sa-east-1.pooler.supabase.com:6543/postgres'],
    ['otro protocolo', 'mysql://postgres:password@127.0.0.1:5434/stock_test'],
  ])('rechaza %s', (_caso, url) => {
    expect(() => assertTestDatabaseUrl({ url, nodeEnv: 'test' })).toThrow(`La URL de la base no es la de db-test (${TEST_DATABASE_URL.description}).`);
  });

  it('rechaza una URL ausente', () => {
    expect(() => assertTestDatabaseUrl({ url: undefined, nodeEnv: 'test' })).toThrow('Falta LOCAL_DATABASE_URL de db-test (.env.test). Corré los tests con npm run test:int o npm run test:e2e.');
  });

  it('rechaza una URL mal formada', () => {
    expect(() => assertTestDatabaseUrl({ url: 'no-es-una-url', nodeEnv: 'test' })).toThrow(`La URL de la base no es la de db-test (${TEST_DATABASE_URL.description}).`);
  });

  it('rechaza NODE_ENV=production aunque la URL sea la de tests', () => {
    const url = 'postgresql://postgres:password@127.0.0.1:5434/stock_test';
    expect(() => assertTestDatabaseUrl({ url, nodeEnv: 'production' })).toThrow('Los tests de integración no corren con NODE_ENV=production.');
  });

  it('rechaza APP_ENV=production, que haría que la app use DATABASE_URL', () => {
    const url = 'postgresql://postgres:password@127.0.0.1:5434/stock_test';
    expect(() => assertTestDatabaseUrl({ url, nodeEnv: 'test', appEnv: 'production' })).toThrow('Los tests de integración no corren con APP_ENV=production.');
  });

  it('ninguna cadena arbitraria pasa la guarda', () => {
    fc.assert(
      fc.property(fc.string(), (url) => {
        expect(() => assertTestDatabaseUrl({ url, nodeEnv: 'test' })).toThrow();
      })
    );
  });
});
