import { afterEach, describe, expect, it, vi } from 'vitest';
import nextConfig from '../../next.config';
import { sqlOnlyLogger } from '@/lib/db/query-logger';

describe('logs de desarrollo sin datos sensibles (BUG-6 CA-1)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('regression BUG-6: Next no imprime los argumentos de las Server Actions', () => {
    expect(nextConfig.logging).toEqual({ serverFunctions: false });
  });

  it('regression BUG-6: el log de Drizzle muestra el SQL sin los parámetros', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    sqlOnlyLogger.logQuery('select "id" from "users" where "username" = $1', ['dato-sensible']);
    expect(log).toHaveBeenCalledWith('Query: select "id" from "users" where "username" = $1');
    expect(JSON.stringify(log.mock.calls)).not.toContain('dato-sensible');
  });
});
