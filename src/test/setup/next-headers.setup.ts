import { afterEach, vi } from 'vitest';

vi.mock('next/headers', async () => {
  const { cookieJar } = await import('../cookie-jar');
  return { cookies: async () => cookieJar };
});

afterEach(async () => {
  const { cookieJar } = await import('../cookie-jar');
  cookieJar.clear();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
