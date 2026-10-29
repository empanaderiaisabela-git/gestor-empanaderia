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

  it.each(['sanguches', 'empanadas'] as const)('rechaza un gusto de %s con un solo precio y acepta con los cuatro (US-28)', async (group) => {
    expect(await outcome({ group, name: 'Uno', price1: '1500.00' })).toBe('VALIDATION');
    expect(await outcome({ group, name: 'Tres', price1: '1500.00', price3: '4200.00', price6: '8000.00' })).toBe('VALIDATION');
    expect(await outcome({ group, name: 'Cuatro', unitCost: '500.00', ...ALL_PRICES })).toBe('ok');
  });

  it('en pizzas, ciabattas y bebidas acepta sólo el precio de unidad, y rechaza el resto (US-28)', async () => {
    expect(await outcome({ group: 'pizzas', name: 'Entera', price1: '11000.00' })).toBe('ok');
    expect(await outcome({ group: 'ciabattas', name: 'Capresse', price1: '6000.00' })).toBe('ok');
    expect(await outcome({ group: 'ciabattas', name: 'Con docena', ...ALL_PRICES })).toBe('VALIDATION');
    expect(await outcome({ group: 'coca_cola', name: 'Lata', price1: '0.00' })).toBe('VALIDATION');
    expect(await outcome({ group: 'pizzas', name: 'Con seis', price1: '11000.00', price6: '1.00' })).toBe('VALIDATION');
    expect(await outcome({ group: 'pizzas', name: 'Sólo seis', price6: '1.00' })).toBe('VALIDATION');
  });

  it('un precio en 0 y un costo negativo se rechazan', async () => {
    expect(await outcome({ group: 'empanadas', name: 'En cero', ...ALL_PRICES, price12: '0.00' })).toBe('VALIDATION');
    expect(await outcome({ group: 'pizzas', name: 'Costo negativo', unitCost: '-1.00' })).toBe('VALIDATION');
  });

  it('una base sólo existe en Pizzas y Ciabattas, una por grupo, sin costo ni precios y con stock entero (US-29)', async () => {
    const base = { name: 'Prepizza', isBase: true } as const;
    expect(await outcome({ group: 'pizzas', ...base, stock: '3' })).toBe('ok');
    expect(await outcome({ group: 'pizzas', ...base, name: 'Otra prepizza' })).toBe('DUPLICATE');
    expect(await outcome({ group: 'ciabattas', ...base, name: 'Pan', unitCost: '100.00' })).toBe('VALIDATION');
    expect(await outcome({ group: 'ciabattas', ...base, name: 'Pan', price1: '100.00' })).toBe('VALIDATION');
    expect(await outcome({ group: 'ciabattas', ...base, name: 'Pan', stock: '0.5' })).toBe('VALIDATION');
    expect(await outcome({ group: 'empanadas', ...base, name: 'Tapa' })).toBe('VALIDATION');
  });
});
