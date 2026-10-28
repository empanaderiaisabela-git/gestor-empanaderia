import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeStockUnitOfWork, type FakeStockUnitOfWork } from '../testing/fake-stock-unit-of-work';
import { stockItem } from '../testing/stock-item';
import { createStockService, type StockService } from './stock.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };
const PROVIDER = '22222222-2222-4222-8222-222222222222';
const PREPIZZA = stockItem({ id: '11111111-1111-4111-8111-111111111111', group: 'pizzas', name: 'Prepizza', unitCost: null, stock: '3.0', isBase: true });
const MUZZA = stockItem({ id: '33333333-3333-4333-8333-333333333333', group: 'pizzas', name: 'Muzza', unitCost: '3000.00', stock: '0.0', price1: '11000.00' });
const NAPO = stockItem({ id: '44444444-4444-4444-8444-444444444444', group: 'pizzas', name: 'Napolitana', unitCost: '3500.00', stock: '0.0', price1: '12000.00' });
const CAPRESSE = stockItem({ id: '55555555-5555-4555-8555-555555555555', group: 'ciabattas', name: 'Capresse', unitCost: '2500.00', stock: '0.0', price1: '6000.00' });

describe('Stock de prepizzas y panes (US-29 CA-2 y CA-4)', () => {
  let fake: FakeStockUnitOfWork;
  let service: StockService;
  const prepizza = (): unknown => fake.state.items.find((item) => item.id === PREPIZZA.id);

  beforeEach(() => {
    fake = createFakeStockUnitOfWork();
    fake.state.items.push(...[PREPIZZA, MUZZA, NAPO, CAPRESSE].map((item) => ({ ...item })));
    service = createStockService({ unitOfWork: fake });
  });

  it('el ingreso de una base pide sólo la cantidad: costo 0 en el historial y la base sigue sin costo ni precios', async () => {
    const { item, entry } = await service.registerEntry(CALLER, { menuItemId: PREPIZZA.id, quantity: 2, providerId: PROVIDER });
    expect(item).toMatchObject({ stock: '5.0', unitCost: null, price1: null, version: 2 });
    expect(entry).toMatchObject({ quantity: 2, unitCost: '0.00', providerId: PROVIDER });
    expect(fake.state.audits[0]).toMatchObject({ action: 'CREAR', entity: 'STOCK_ENTRY', detail: { name: 'Prepizza', quantity: 2, unitCost: 0, stockBefore: 3, stockAfter: 5 } });
  });

  it('VALIDATION: el ingreso de una base con costo o precios', async () => {
    await expect(service.registerEntry(CALLER, { menuItemId: PREPIZZA.id, quantity: 2, unitCost: 100 })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(service.registerEntry(CALLER, { menuItemId: PREPIZZA.id, quantity: 2, prices: { price1: 100 } })).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('VALIDATION: un gusto de Pizzas o Ciabattas no recibe ingresos ni pérdidas, y no se guarda nada', async () => {
    await expect(service.registerEntry(CALLER, { menuItemId: MUZZA.id, quantity: 2, unitCost: 3000 })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(service.registerEntry(CALLER, { menuItemId: CAPRESSE.id, quantity: 2 })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(service.registerLoss(CALLER, { menuItemId: MUZZA.id, quantity: 1, reason: 'x' })).rejects.toMatchObject({ code: 'VALIDATION' });
    expect([fake.state.entries, fake.state.losses, fake.state.audits]).toEqual([[], [], []]);
  });

  it('la pérdida de una base baja el contador con costo 0, así no resta de la ganancia', async () => {
    const { item, loss } = await service.registerLoss(CALLER, { menuItemId: PREPIZZA.id, quantity: 1, reason: 'Se rompió' });
    expect(item).toMatchObject({ stock: '2.0' });
    expect(loss).toMatchObject({ quantity: '1.0', unitCost: '0.00' });
    await expect(service.registerLoss(CALLER, { menuItemId: PREPIZZA.id, quantity: 3, reason: 'x' })).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK', message: 'No hay stock suficiente de Prepizza.' });
  });

  it('VALIDATION: "Costo y precio" de una base', async () => {
    await expect(service.setPricing(CALLER, { menuItemId: PREPIZZA.id, version: 1, unitCost: 0, prices: { price1: 100 }, applyToGroup: false })).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(prepizza()).toMatchObject({ price1: null, version: 1 });
  });

  it('"aplicar a todos los gustos del grupo" no toca la base', async () => {
    const { applied } = await service.setPricing(CALLER, { menuItemId: MUZZA.id, version: 1, unitCost: 3100, prices: { price1: 12500 }, applyToGroup: true });
    expect(applied).toBe(1);
    expect(fake.state.items.find((item) => item.id === NAPO.id)).toMatchObject({ price1: '12500.00' });
    expect(prepizza()).toMatchObject({ price1: null, version: 1 });
  });
});
