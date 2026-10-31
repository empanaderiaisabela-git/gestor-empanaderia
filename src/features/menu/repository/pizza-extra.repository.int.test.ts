import { readFileSync } from 'node:fs';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { pizzaExtras } from '@/lib/db/menu-schema';
import { truncateAll } from '@/test/truncate-all';
import { drizzlePizzaExtraRepository } from './pizza-extra.repository';

describe('pizza_extras (US-47 CA-1)', () => {
  const repository = drizzlePizzaExtraRepository(db);

  beforeEach(truncateAll);
  afterAll(async () => {
    await db.$client.end();
  });

  it('la migración 0025 sólo crea la tabla, sin filas', async () => {
    expect(readFileSync('src/lib/db/migrations/0025_jamon-extra.sql', 'utf8')).toMatch(/^CREATE TABLE "pizza_extras"/);
    expect(await repository.findHam()).toBeNull();
  });

  it('el primer precio se inserta en la versión 1 y los siguientes filtran por versión', async () => {
    expect(await repository.saveHam({ price: 1500, version: 0 })).toMatchObject({ code: 'jamon', price: '1500.00', version: 1 });
    expect(await repository.saveHam({ price: 1600, version: 0 })).toBeNull();
    expect(await repository.saveHam({ price: 1800, version: 1 })).toMatchObject({ price: '1800.00', version: 2 });
    expect(await repository.saveHam({ price: 1900, version: 1 })).toBeNull();
    expect(await repository.findHam()).toMatchObject({ price: '1800.00', version: 2 });
  });

  it('el check rechaza un precio de 0', async () => {
    await expect(db.insert(pizzaExtras).values({ code: 'jamon', price: '0' })).rejects.toThrow();
  });
});
