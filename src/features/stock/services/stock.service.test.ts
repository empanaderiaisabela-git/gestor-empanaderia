import { beforeEach, describe, expect, it } from 'vitest';
import type { StockUnitOfWork } from '@/features/stock/repository/stock-unit-of-work';
import { createFakeStockUnitOfWork, type FakeStockUnitOfWork } from '../testing/fake-stock-unit-of-work';
import { groupPriceRow, stockItem } from '../testing/stock-item';
import { createStockService, type StockService } from './stock.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };
const PROVIDER = '22222222-2222-4222-8222-222222222222';

describe('stock.service (US-4)', () => {
  let fake: FakeStockUnitOfWork;
  let service: StockService;
  const empanada = stockItem({ id: '11111111-1111-4111-8111-111111111111' });
  const pizza = stockItem({ id: '33333333-3333-4333-8333-333333333333', group: 'pizzas', name: 'Muzza', stock: '2.5', unitCost: '3000.00', price1: '11000.00' });

  beforeEach(() => {
    fake = createFakeStockUnitOfWork();
    fake.state.items.push({ ...empanada }, { ...pizza });
    fake.state.groupPrices.push(groupPriceRow());
    fake.state.usernames.set(CALLER.id, 'admin');
    fake.state.providerNames.set(PROVIDER, 'Molino del Sur');
    service = createStockService({ unitOfWork: fake });
  });

  it('ingresar stock suma unidades, actualiza el costo, sube la versión y queda en el historial (CA-2, CA-3)', async () => {
    const { item, entry } = await service.registerEntry(CALLER, { menuItemId: empanada.id, quantity: 24, unitCost: 450, providerId: PROVIDER });
    expect(item).toMatchObject({ stock: '34.0', unitCost: '450.00', version: 2 });
    expect(entry).toMatchObject({ quantity: 24, unitCost: '450.00', providerId: PROVIDER, userId: CALLER.id });
    expect(await service.entriesOf(empanada.id)).toMatchObject([{ quantity: 24, providerName: 'Molino del Sur', username: 'admin' }]);
    expect(fake.state.audits).toEqual([{ userId: CALLER.id, action: 'CREAR', entity: 'STOCK_ENTRY', entityId: entry.id, detail: { name: 'Carne suave', quantity: 24, unitCost: 450, stockBefore: 10, stockAfter: 34 } }]);
  });

  it('sin costo nuevo, el ingreso conserva el costo actual y no tiene proveedor', async () => {
    const { item, entry } = await service.registerEntry(CALLER, { menuItemId: empanada.id, quantity: 6 });
    expect(item).toMatchObject({ stock: '16.0', unitCost: '400.00' });
    expect(entry).toMatchObject({ unitCost: '400.00', providerId: null });
  });

  it('el historial va del ingreso más nuevo al más viejo', async () => {
    await service.registerEntry(CALLER, { menuItemId: empanada.id, quantity: 1 });
    await service.registerEntry(CALLER, { menuItemId: empanada.id, quantity: 2 });
    expect((await service.entriesOf(empanada.id)).map((entry) => entry.quantity)).toEqual([2, 1]);
  });

  it('una merma descuenta el stock, guarda el costo del momento y audita PÉRDIDA (CA-4)', async () => {
    const { item, loss } = await service.registerLoss(CALLER, { menuItemId: pizza.id, quantity: 0.5, reason: 'Se quemó' });
    expect(item).toMatchObject({ stock: '2.0' });
    expect(loss).toMatchObject({ quantity: '0.5', unitCost: '3000.00', reason: 'Se quemó' });
    expect(fake.state.audits.at(-1)).toMatchObject({ action: 'PÉRDIDA', entity: 'STOCK_LOSS', detail: { stockBefore: 2.5, stockAfter: 2 } });
  });

  it('INSUFFICIENT_STOCK: una merma mayor que el stock (CA-5)', async () => {
    await expect(service.registerLoss(CALLER, { menuItemId: empanada.id, quantity: 11, reason: 'x' })).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK', message: 'No hay stock suficiente de Carne suave.' });
    await expect(service.registerLoss(CALLER, { menuItemId: empanada.id, quantity: 10, reason: 'x' })).resolves.toMatchObject({ item: { stock: '0.0' } });
  });

  it('VALIDATION: sólo las pizzas admiten media unidad de merma', async () => {
    await expect(service.registerLoss(CALLER, { menuItemId: empanada.id, quantity: 0.5, reason: 'x' })).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('NOT_FOUND: el gusto ya no existe', async () => {
    const ghost = '44444444-4444-4444-8444-444444444444';
    await expect(service.registerEntry(CALLER, { menuItemId: ghost, quantity: 1 })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'El producto ya no existe.' });
    await expect(service.registerLoss(CALLER, { menuItemId: ghost, quantity: 1, reason: 'x' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('STALE_VERSION: si el gusto cambió entre la lectura y la escritura', async () => {
    fake.state.items[0].version = 5;
    const staleRead: StockUnitOfWork = { read: fake.read, run: (work) => fake.run((scope) => work({ ...scope, stock: { ...scope.stock, lockItem: async () => ({ ...empanada, version: 1 }) } })) };
    await expect(createStockService({ unitOfWork: staleRead }).registerEntry(CALLER, { menuItemId: empanada.id, quantity: 1 })).rejects.toMatchObject({ code: 'STALE_VERSION' });
  });
});
