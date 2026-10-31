import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeStockUnitOfWork, type FakeStockUnitOfWork } from '../testing/fake-stock-unit-of-work';
import { stockItem } from '../testing/stock-item';
import { createStockService, type StockService } from './stock.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };
const drink = (id: string, flavor: string, liters = '1.500') => stockItem({ id, group: 'coca_cola', name: `Aquarius ${liters} L ${flavor}`, drinkName: 'Aquarius', liters, flavor, unitCost: null, stock: '0.0' });
const [MANZANA, PERA, POMELO, UN_LITRO] = [drink('11111111-1111-4111-8111-111111111111', 'Manzana'), drink('22222222-2222-4222-8222-222222222222', 'Pera'), drink('33333333-3333-4333-8333-333333333333', 'Pomelo'), drink('44444444-4444-4444-8444-444444444444', 'Pera', '1.000')];

describe('bebidas: la familia comparte costo y precio (US-49 CA-3 y CA-4)', () => {
  let fake: FakeStockUnitOfWork;
  let service: StockService;
  const row = (id: string) => fake.state.items.find((item) => item.id === id);

  beforeEach(() => {
    fake = createFakeStockUnitOfWork();
    fake.state.items.push(...[MANZANA, PERA, POMELO, UN_LITRO].map((item) => ({ ...item })));
    service = createStockService({ unitOfWork: fake });
  });

  it('el primer sabor pide todo y se lo pasa a la familia; los otros litros no', async () => {
    await expect(service.registerEntry(CALLER, { menuItemId: MANZANA.id, quantity: 6 })).rejects.toMatchObject({ code: 'MISSING_COST' });
    await service.registerEntry(CALLER, { menuItemId: MANZANA.id, quantity: 6, unitCost: 900, prices: { price1: 2500 } });
    expect([PERA, POMELO, UN_LITRO].map((item) => [row(item.id)?.unitCost, row(item.id)?.price1])).toEqual([['900.00', '2500.00'], ['900.00', '2500.00'], [null, null]]);
  });

  it('un sabor de una familia con precio sólo pide la cantidad', async () => {
    Object.assign(row(MANZANA.id) ?? {}, { unitCost: '900.00', price1: '2500.00' });
    const { item, entry } = await service.registerEntry(CALLER, { menuItemId: PERA.id, quantity: 4 });
    expect(item).toMatchObject({ stock: '4.0', unitCost: '900.00', price1: '2500.00' });
    expect(entry.unitCost).toBe('900.00');
  });

  it('"Costo y precio" de un sabor cambia toda la familia, sin la casilla', async () => {
    await service.registerEntry(CALLER, { menuItemId: MANZANA.id, quantity: 6, unitCost: 900, prices: { price1: 2500 } });
    const { applied } = await service.setPricing(CALLER, { menuItemId: POMELO.id, version: 2, unitCost: 1000, prices: { price1: 2800 }, applyToGroup: false });
    expect(applied).toBe(2);
    expect([MANZANA, PERA, POMELO].map((item) => row(item.id)?.price1)).toEqual(['2800.00', '2800.00', '2800.00']);
    expect(row(MANZANA.id)?.unitCost).toBe('1000.00');
  });
});
