import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeStockUnitOfWork, type FakeStockUnitOfWork } from '../testing/fake-stock-unit-of-work';
import { stockItem } from '../testing/stock-item';
import { createStockService, type StockService } from './stock.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };
const PROVIDER = '22222222-2222-4222-8222-222222222222';
const DOZEN = { price1: '1200.00', price3: '3400.00', price6: '6500.00', price12: '12000.00' };

describe('editar un ingreso de stock (US-46 CA-3)', () => {
  let fake: FakeStockUnitOfWork;
  let service: StockService;
  const carne = stockItem({ id: '11111111-1111-4111-8111-111111111111', name: 'Carne', stock: '0.0', unitCost: '800.00', ...DOZEN });
  const pollo = stockItem({ id: '33333333-3333-4333-8333-333333333333', name: 'Pollo', stock: '5.0', unitCost: '700.00', ...DOZEN });
  const stockOf = (id: string): string | undefined => fake.state.items.find((item) => item.id === id)?.stock;

  beforeEach(async () => {
    fake = createFakeStockUnitOfWork();
    fake.state.items.push({ ...carne }, { ...pollo });
    service = createStockService({ unitOfWork: fake });
  });

  const enter = async (quantity: number, unitCost: number): Promise<{ id: string; version: number }> => (await service.registerEntry(CALLER, { menuItemId: carne.id, quantity, unitCost })).entry;

  it('cambiar la cantidad sube o baja la diferencia y queda en Auditoría', async () => {
    const entry = await enter(10, 800);
    const { item, entry: edited } = await service.updateEntry(CALLER, { id: entry.id, version: 1, menuItemId: carne.id, quantity: 6, unitCost: 800, providerId: PROVIDER });
    expect(item.stock).toBe('6.0');
    expect(edited).toMatchObject({ quantity: 6, providerId: PROVIDER, version: 2 });
    expect(fake.state.audits.at(-1)).toMatchObject({ action: 'ACTUALIZAR', entity: 'STOCK_ENTRY', entityId: entry.id, detail: { before: { name: 'Carne', quantity: 10 }, after: { name: 'Carne', quantity: 6, providerId: PROVIDER }, stockAfter: 6 } });
  });

  it('cambiar el gusto pasa las unidades del viejo al nuevo (D-3)', async () => {
    const entry = await enter(10, 800);
    await service.updateEntry(CALLER, { id: entry.id, version: 1, menuItemId: pollo.id, quantity: 10, unitCost: 750 });
    expect([stockOf(carne.id), stockOf(pollo.id)]).toEqual(['0.0', '15.0']);
    expect(await service.entriesOf(pollo.id)).toMatchObject([{ id: entry.id, quantity: 10 }]);
  });

  it('INSUFFICIENT_STOCK: el stock nunca queda negativo, ni al bajar ni al mover (P-7)', async () => {
    const entry = await enter(10, 800);
    fake.state.items[0].stock = '2.0';
    await expect(service.updateEntry(CALLER, { id: entry.id, version: 1, menuItemId: carne.id, quantity: 1, unitCost: 800 })).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK', message: 'No hay stock suficiente de Carne.' });
    await expect(service.updateEntry(CALLER, { id: entry.id, version: 1, menuItemId: pollo.id, quantity: 10, unitCost: 800 })).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
    expect(fake.state.entries[0]).toMatchObject({ quantity: 10, version: 1 });
  });

  it('el costo pasa al gusto sólo si cambió y es su ingreso más reciente (P-6)', async () => {
    const monday = await enter(5, 800);
    const thursday = await enter(5, 900);
    await service.updateEntry(CALLER, { id: monday.id, version: 1, menuItemId: carne.id, quantity: 5, unitCost: 850, providerId: PROVIDER });
    expect(fake.state.items[0].unitCost).toBe('900.00');
    fake.state.items[0].unitCost = '950.00';
    await service.updateEntry(CALLER, { id: thursday.id, version: 1, menuItemId: carne.id, quantity: 5, unitCost: 900, providerId: PROVIDER });
    expect(fake.state.items[0].unitCost).toBe('950.00');
    await service.updateEntry(CALLER, { id: thursday.id, version: 2, menuItemId: carne.id, quantity: 5, unitCost: 980 });
    expect(fake.state.items[0].unitCost).toBe('980.00');
  });

  it('los precios de venta y el mínimo quedan como los actuales del gusto (P-6)', async () => {
    const entry = await enter(4, 800);
    const { item } = await service.updateEntry(CALLER, { id: entry.id, version: 1, menuItemId: carne.id, quantity: 4, unitCost: 800, prices: { price1: 1300, price3: 3600, price6: 7000, price12: 13000 }, minStock: 3 });
    expect(item).toMatchObject({ price1: '1300.00', minStock: 3 });
  });

  it('STALE_VERSION con una versión vieja, NOT_FOUND si el ingreso no existe y VALIDATION hacia un gusto de pizza', async () => {
    const entry = await enter(4, 800);
    const muzza = stockItem({ id: '44444444-4444-4444-8444-444444444444', group: 'pizzas', name: 'Muzza', price1: '11000.00' });
    fake.state.items.push(muzza);
    await expect(service.updateEntry(CALLER, { id: entry.id, version: 7, menuItemId: carne.id, quantity: 4 })).rejects.toMatchObject({ code: 'STALE_VERSION' });
    await expect(service.updateEntry(CALLER, { id: muzza.id, version: 1, menuItemId: carne.id, quantity: 4 })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'El ingreso ya no existe.' });
    await expect(service.updateEntry(CALLER, { id: entry.id, version: 1, menuItemId: muzza.id, quantity: 4 })).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});
