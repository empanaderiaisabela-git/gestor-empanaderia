import { resolveDatabaseConfig } from '../database-config';

type Env = Readonly<Record<string, string | undefined>>;

const LOCAL_HOSTS = ['localhost', '127.0.0.1'];
const BLOCKED = 'Script destructivo bloqueado';

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    throw new Error(`${BLOCKED}: la URL de la base no es válida.`);
  }
}

export function assertSafeToWipe(env: Env): void {
  if (env.APP_ENV === 'production') {
    throw new Error(`${BLOCKED}: APP_ENV=production apunta a la base de producción.`);
  }
  const host = hostOf(resolveDatabaseConfig(env).url);
  if (!LOCAL_HOSTS.includes(host)) {
    throw new Error(`${BLOCKED}: la base no es local (${host}).`);
  }
}
