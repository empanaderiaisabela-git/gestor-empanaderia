import { vi } from 'vitest';

const NO_DATABASE = 'Los tests unit no usan la base: usá un fake, un spy o un test de integración (*.int.test.ts).';

vi.mock('@/lib/db', () => ({
  db: new Proxy(
    {},
    {
      get(_target, key) {
        if (typeof key === 'symbol' || key === 'then') return undefined;
        throw new Error(NO_DATABASE);
      },
    }
  ),
}));
