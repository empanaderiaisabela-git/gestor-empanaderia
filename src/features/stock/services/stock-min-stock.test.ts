import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeStockUnitOfWork, type FakeStockUnitOfWork } from '../testing/fake-stock-unit-of-work';
import { stockItem } from '../testing/stock-item';
import { createStockService, type StockService } from './stock.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };

describe('stock mínimo al ingresar stock (US-45 CA-2, P-5)', () => {
  let fake: FakeStockUnitOfWork;
  let service: StockService;
  const carne = stockItem({ id: '11111111-1111-4111-8111-111111111111', name: 'Carne', price1: '1200.00', price3: '3400.00', price6: '6500.00', price12: '12000.00', minStock: 5 });
  const prepizza = stockItem({ id: '22222222-2222-4222-8222-222222222222', group: 'pizzas', name: 'Prepizza', isBase: true, unitCost: null, stock: '0.0' });

  beforeEach(() => {
    fake = createFakeStockUnitOfWork();
    fake.state.items.push({ ...carne }, { ...prepizza });
    service = createStockService({ unitOfWork: fake });
  });

  it('guarda el mínimo nuevo del gusto y lo deja en Auditoría', async () => {
    const { item } = await service.registerEntry(CALLER, { menuItemId: carne.id, quantity: 10, minStock: 8 });
    expect(item).toMatchObject({ stock: '20.0', minStock: 8 });
    expect(fake.state.audits[0].detail).toMatchObject({ minStock: 8 });
  });

  it('sin el campo, conserva el mínimo; con null, el gusto queda sin mínimo', async () => {
    expect((await service.registerEntry(CALLER, { menuItemId: carne.id, quantity: 1 })).item.minStock).toBe(5);
    expect((await service.registerEntry(CALLER, { menuItemId: carne.id, quantity: 1, minStock: null })).item.minStock).toBeNull();
  });

  it('la prepizza también acepta un mínimo (P-5)', async () => {
    expect((await service.registerEntry(CALLER, { menuItemId: prepizza.id, quantity: 4, minStock: 2 })).item).toMatchObject({ stock: '4.0', minStock: 2 });
  });
});
