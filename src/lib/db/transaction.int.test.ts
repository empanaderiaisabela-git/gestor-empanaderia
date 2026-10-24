import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { providers } from '@/lib/db/schema';
import { truncateAll } from '@/test/truncate-all';
import { withTransaction } from './transaction';

describe('withTransaction (T-4 CA-3)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('confirma los cambios cuando el trabajo termina bien y devuelve su resultado', async () => {
    const name = await withTransaction(async (tx) => {
      const [created] = await tx.insert(providers).values({ name: 'Confirmado' }).returning({ name: providers.name });
      return created.name;
    });
    expect(name).toBe('Confirmado');
    expect(await db.select({ name: providers.name }).from(providers)).toEqual([{ name: 'Confirmado' }]);
  });

  it('deshace todo si el trabajo falla', async () => {
    const work = withTransaction(async (tx) => {
      await tx.insert(providers).values({ name: 'Deshecho' });
      throw new Error('falla a mitad de camino');
    });
    await expect(work).rejects.toThrow('falla a mitad de camino');
    expect(await db.select({ name: providers.name }).from(providers)).toEqual([]);
  });
});
