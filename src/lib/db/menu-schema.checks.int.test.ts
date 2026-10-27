import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { databaseErrorCode } from '@/lib/db-errors';
import { truncateAll } from '@/test/truncate-all';

type Row = typeof menuItems.$inferInsert;

const ALL_PRICES = { price1: '1500.00', price3: '4200.00', price6: '8000.00', price12: '15000.00' };

async function outcome(row: Row): Promise<string> {
  return db.insert(menuItems).values(row).then(
    () => 'ok',
    (error: unknown) => databaseErrorCode(error) ?? 'otro'
  );
}

describe('checks de menu_items con costo y precios cargados después (US-17)', () => {
  beforeEach(truncateAll);
  afterAll(async () => {
    await db.$client.end();
  });

  it.each(['empanadas', 'pizzas', 'sanguches', 'ciabattas', 'coca_cola', 'pepsi'] as const)('acepta un gusto de %s sin costo ni precios', async (group) => {
    expect(await outcome({ group, name: 'Sin datos' })).toBe('ok');
  });

  it('rechaza un sanguche con un solo precio y acepta con los cuatro', async () => {
    expect(await outcome({ group: 'sanguches', name: 'Uno', price1: '1500.00' })).toBe('VALIDATION');
    expect(await outcome({ group: 'sanguches', name: 'Cuatro', unitCost: '500.00', ...ALL_PRICES })).toBe('ok');
  });

  it('en pizzas y bebidas acepta sólo el precio de la entera, y rechaza el resto', async () => {
    expect(await outcome({ group: 'pizzas', name: 'Entera', price1: '11000.00' })).toBe('ok');
    expect(await outcome({ group: 'coca_cola', name: 'Lata', price1: '0.00' })).toBe('VALIDATION');
    expect(await outcome({ group: 'pizzas', name: 'Con seis', price1: '11000.00', price6: '1.00' })).toBe('VALIDATION');
    expect(await outcome({ group: 'pizzas', name: 'Sólo seis', price6: '1.00' })).toBe('VALIDATION');
  });

  it('empanadas y ciabattas no tienen precio propio; el costo no puede ser negativo', async () => {
    expect(await outcome({ group: 'empanadas', name: 'Con precio', price1: '1.00' })).toBe('VALIDATION');
    expect(await outcome({ group: 'pizzas', name: 'Costo negativo', unitCost: '-1.00' })).toBe('VALIDATION');
  });
});
