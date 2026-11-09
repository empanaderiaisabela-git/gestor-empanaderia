import { beforeEach, describe, expect, it } from 'vitest';
import type { StockOverwriteInput } from '@/features/stock/domain/stock.schema';
import { createFakeStockUnitOfWork, type FakeStockUnitOfWork } from '../testing/fake-stock-unit-of-work';
import { stockItem } from '../testing/stock-item';
import { createStockService, type StockService } from './stock.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };
const PROVIDER = '22222222-2222-4222-8222-222222222222';
const DOZEN = { price1: '1200.00', price3: '3400.00', price6: '6500.00', price12: '12000.00' };

describe('el lápiz pisa el stock (US-70)', () => {
  let fake: FakeStockUnitOfWork;
  let service: StockService;
  const carne = stockItem({ id: '11111111-1111-4111-8111-111111111111', name: 'Carne', stock: '0.0', unitCost: '800.00', ...DOZEN });
  const row = (): (typeof fake.state.items)[number] => fake.state.items[0];
  const sell = (units: number): void => void Object.assign(row(), { stock: (Number(row().stock) - units).toFixed(1), version: row().version + 1 });
  const overwrite = (input: Partial<StockOverwriteInput>) => service.overwriteStock(CALLER, { menuItemId: carne.id, itemVersion: row().version, stock: 0, entry: null, ...input });
  const enter = async (quantity: number, unitCost = 800): Promise<{ id: string; version: number }> => (await service.registerEntry(CALLER, { menuItemId: carne.id, quantity, unitCost })).entry;

  beforeEach(() => {
    fake = createFakeStockUnitOfWork();
    fake.state.items.push({ ...carne });
    service = createStockService({ unitOfWork: fake });
  });

  it('regresión US-70: ingresó 40, vendió 23; escribe 17 y queda 17, sin restar las ventas', async () => {
    const entry = await enter(40);
    sell(23);
    const { item } = await overwrite({ stock: 17, entry: { id: entry.id, version: 1 } });
    expect(item.stock).toBe('17.0');
    expect((await overwrite({ stock: 1 })).item.stock).toBe('1.0');
    expect((await overwrite({ stock: 0 })).item.stock).toBe('0.0');
  });

  it('el ingreso conserva su cantidad y su gusto; cambian su costo y su proveedor (CA-2)', async () => {
    const entry = await enter(40);
    const { entry: edited } = await overwrite({ stock: 30, unitCost: 850, providerId: PROVIDER, entry: { id: entry.id, version: 1 } });
    expect(edited).toMatchObject({ menuItemId: carne.id, quantity: 40, unitCost: '850.00', providerId: PROVIDER, version: 2 });
  });

  it('sin ingreso guarda stock, costo, precios y mínimo en el gusto y no crea ingresos (CA-3)', async () => {
    const { item, entry } = await overwrite({ stock: 12, unitCost: 900, prices: { price1: 1300, price3: 3600, price6: 7000, price12: 13000 }, minStock: 3 });
    expect(entry).toBeNull();
    expect(item).toMatchObject({ stock: '12.0', unitCost: '900.00', price1: '1300.00', minStock: 3 });
    expect(fake.state.entries).toEqual([]);
  });

  it('el costo pasa al gusto sólo si cambió y es su ingreso más reciente (P-6)', async () => {
    const monday = await enter(5, 800);
    const thursday = await enter(5, 900);
    await overwrite({ stock: 10, unitCost: 850, entry: { id: monday.id, version: 1 } });
    expect(row().unitCost).toBe('900.00');
    await overwrite({ stock: 10, unitCost: 980, entry: { id: thursday.id, version: 1 } });
    expect(row().unitCost).toBe('980.00');
  });

  it('STALE_VERSION si el gusto cambió desde que se abrió, por ejemplo por una venta (CA-4)', async () => {
    const entry = await enter(40);
    const opened = row().version;
    sell(1);
    await expect(overwrite({ itemVersion: opened, stock: 17, entry: { id: entry.id, version: 1 } })).rejects.toMatchObject({ code: 'STALE_VERSION' });
    await expect(overwrite({ stock: 17, entry: { id: entry.id, version: 9 } })).rejects.toMatchObject({ code: 'STALE_VERSION' });
    expect(row().stock).toBe('39.0');
  });

  it('queda en Auditoría con el stock de antes y de después (CA-5)', async () => {
    const entry = await enter(40);
    sell(23);
    await overwrite({ stock: 15, providerId: PROVIDER, entry: { id: entry.id, version: 1 } });
    expect(fake.state.audits.at(-1)).toMatchObject({ action: 'ACTUALIZAR', entity: 'MENU_ITEM', entityId: carne.id, detail: { name: 'Carne', stockBefore: 17, stockAfter: 15, entry: { before: { quantity: 40, providerId: null }, after: { quantity: 40, providerId: PROVIDER } } } });
  });

  it('NOT_FOUND si el ingreso no existe; VALIDATION con un ingreso de otro gusto o proveedor sin ingreso', async () => {
    const pollo = stockItem({ id: '33333333-3333-4333-8333-333333333333', name: 'Pollo', ...DOZEN });
    fake.state.items.push(pollo);
    const other = (await service.registerEntry(CALLER, { menuItemId: pollo.id, quantity: 4 })).entry;
    await expect(overwrite({ entry: { id: carne.id, version: 1 } })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'El ingreso ya no existe.' });
    await expect(overwrite({ entry: { id: other.id, version: 1 } })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(overwrite({ providerId: PROVIDER })).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('VALIDATION en un gusto de pizza; la base no lleva costo (US-29)', async () => {
    const muzza = stockItem({ id: '44444444-4444-4444-8444-444444444444', group: 'pizzas', name: 'Muzza', price1: '11000.00' });
    const prepizza = stockItem({ id: '55555555-5555-4555-8555-555555555555', group: 'pizzas', name: 'Prepizza', isBase: true, unitCost: null });
    fake.state.items.push(muzza, prepizza);
    await expect(service.overwriteStock(CALLER, { menuItemId: muzza.id, itemVersion: 1, stock: 3, entry: null })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(service.overwriteStock(CALLER, { menuItemId: prepizza.id, itemVersion: 1, stock: 3, entry: null, unitCost: 5 })).rejects.toMatchObject({ code: 'VALIDATION' });
    expect((await service.overwriteStock(CALLER, { menuItemId: prepizza.id, itemVersion: 1, stock: 3, entry: null })).item.stock).toBe('3.0');
  });
});
