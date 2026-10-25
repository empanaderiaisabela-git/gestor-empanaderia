import { resolveDatabaseConfig } from '../database-config';
import { assertSafeToWipe } from './assert-safe-to-wipe';

type Env = Readonly<Record<string, string | undefined>>;

export function wipeTargetUrl(env: Env): string {
  assertSafeToWipe(env);
  return resolveDatabaseConfig(env).url;
}
