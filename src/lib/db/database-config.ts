type Env = Readonly<Record<string, string | undefined>>;

export type DatabaseConfig = {
  url: string;
  ssl: boolean;
  logQueries: boolean;
  maxConnections: number | undefined;
};

const APP_ENVS = ['production', 'development', 'test', ''] as const;

function isProduction(env: Env): boolean {
  const appEnv = env.APP_ENV ?? '';
  if (!APP_ENVS.some((valid) => valid === appEnv)) {
    throw new Error(`APP_ENV inválido: "${appEnv}". Valores posibles: production, development, test o vacío.`);
  }
  return appEnv === 'production';
}

function required(env: Env, name: string): string {
  const value = env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

export function envFileFor(env: Env): string {
  return isProduction(env) ? '.env.prod' : '.env.local';
}

export function resolveDatabaseConfig(env: Env): DatabaseConfig {
  if (isProduction(env)) {
    return { url: required(env, 'DATABASE_URL'), ssl: true, logQueries: false, maxConnections: 10 };
  }
  return { url: required(env, 'LOCAL_DATABASE_URL'), ssl: false, logQueries: true, maxConnections: undefined };
}
