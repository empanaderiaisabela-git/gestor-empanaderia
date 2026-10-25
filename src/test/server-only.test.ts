import 'server-only';
import { describe, expect, it } from 'vitest';

describe('server-only en los tests', () => {
  it('se reemplaza por un módulo vacío para poder testear código de servidor', async () => {
    await expect(import('@/test/empty-module')).resolves.toBeDefined();
  });
});
