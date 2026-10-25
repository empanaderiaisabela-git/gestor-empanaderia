import { describe, expect, it } from 'vitest';
import { envFileFor, resolveDatabaseConfig } from './database-config';

const LOCAL_URL = 'postgresql://postgres:password@127.0.0.1:5433/stock_db';
const PRODUCTION_URL = 'postgresql://usuario:clave@base-de-produccion.example.com:6543/postgres';

describe('envFileFor', () => {
  it.each([
    ['sin APP_ENV', {}, '.env.local'],
    ['NODE_ENV=production sin APP_ENV (next build y next start)', { NODE_ENV: 'production' }, '.env.local'],
    ['APP_ENV=development', { APP_ENV: 'development' }, '.env.local'],
    ['APP_ENV=test', { APP_ENV: 'test' }, '.env.local'],
    ['APP_ENV=production', { APP_ENV: 'production' }, '.env.prod'],
  ])('%s carga %s', (_caso, env, expected) => {
    expect(envFileFor(env)).toBe(expected);
  });
});

describe('resolveDatabaseConfig', () => {
  it('usa la base local sin SSL y con log de consultas cuando no es producción', () => {
    expect(resolveDatabaseConfig({ LOCAL_DATABASE_URL: LOCAL_URL })).toEqual({ url: LOCAL_URL, ssl: false, logQueries: true, maxConnections: undefined });
  });

  it('T-8 CA-1: con NODE_ENV=production pero sin APP_ENV no usa la base de producción', () => {
    const env = { NODE_ENV: 'production', LOCAL_DATABASE_URL: LOCAL_URL, DATABASE_URL: PRODUCTION_URL };
    expect(resolveDatabaseConfig(env).url).toBe(LOCAL_URL);
  });

  it('usa la base de producción con SSL sólo con APP_ENV=production', () => {
    const env = { APP_ENV: 'production', LOCAL_DATABASE_URL: LOCAL_URL, DATABASE_URL: PRODUCTION_URL };
    expect(resolveDatabaseConfig(env)).toEqual({ url: PRODUCTION_URL, ssl: true, logQueries: false, maxConnections: 10 });
  });

  it('falla con un mensaje claro si falta LOCAL_DATABASE_URL', () => {
    expect(() => resolveDatabaseConfig({ DATABASE_URL: PRODUCTION_URL })).toThrow('Falta la variable de entorno LOCAL_DATABASE_URL.');
  });

  it('falla con un mensaje claro si en producción falta DATABASE_URL', () => {
    expect(() => resolveDatabaseConfig({ APP_ENV: 'production', LOCAL_DATABASE_URL: LOCAL_URL })).toThrow('Falta la variable de entorno DATABASE_URL.');
  });

  it.each([['prod'], ['PRODUCTION'], ['staging']])('rechaza el valor desconocido APP_ENV=%s', (appEnv) => {
    expect(() => resolveDatabaseConfig({ APP_ENV: appEnv, LOCAL_DATABASE_URL: LOCAL_URL })).toThrow(`APP_ENV inválido: "${appEnv}". Valores posibles: production, development, test o vacío.`);
  });
});
