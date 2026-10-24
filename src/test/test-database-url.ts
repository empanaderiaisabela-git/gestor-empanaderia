export const TEST_DATABASE_URL = {
  hosts: ['localhost', '127.0.0.1'],
  port: '5434',
  database: 'stock_test',
  description: 'localhost:5434/stock_test',
} as const;

type TestDatabaseGuardInput = {
  url: string | undefined;
  nodeEnv: string | undefined;
  appEnv?: string | undefined;
};

function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function isTestDatabase(parsed: URL | null): boolean {
  if (parsed === null) return false;
  const isPostgres = parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
  const isLocalHost = TEST_DATABASE_URL.hosts.some((host) => host === parsed.hostname);
  const isTestPort = parsed.port === TEST_DATABASE_URL.port;
  const isTestName = parsed.pathname === `/${TEST_DATABASE_URL.database}`;
  return isPostgres && isLocalHost && isTestPort && isTestName;
}

export function assertTestDatabaseUrl({ url, nodeEnv, appEnv }: TestDatabaseGuardInput): string {
  if (nodeEnv === 'production') {
    throw new Error('Los tests de integración no corren con NODE_ENV=production.');
  }
  if (appEnv === 'production') {
    throw new Error('Los tests de integración no corren con APP_ENV=production.');
  }
  if (!url) {
    throw new Error('Falta LOCAL_DATABASE_URL. Corré los tests de integración con npm run test:int.');
  }
  if (!isTestDatabase(parseUrl(url))) {
    throw new Error(`La URL de la base no es la de db-test (${TEST_DATABASE_URL.description}).`);
  }
  return url;
}
