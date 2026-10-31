import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeStockUnitOfWork, type FakeStockUnitOfWork } from '../testing/fake-stock-unit-of-work';
import { stockItem } from '../testing/stock-item';
import { createStockService, type StockService } from './stock.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };
const CARNE = stockItem({ id: '11111111-1111-4111-8111-111111111111', name: 'Carne', unitCost: '1000.00', price1: '2750.00', price3: '7500.00', price6: '14000.00', price12: '26000.00' });
const POLLO = stockItem({ id: '22222222-2222-4222-8222-222222222222', name: 'Pollo', unitCost: null, price1: '2500.00', price3: '7000.00', price6: '13000.00', price12: '24000.00' });
const drink = (id: string, flavor: string) => stockItem({ id, group: 'coca_cola', name: `Aquarius 1.5 L ${flavor}`, drinkName: 'Aquarius', liters: '1.500', flavor, unitCost: '900.00', price1: '2500.00' });
const [MANZANA, PERA] = [drink('33333333-3333-4333-8333-333333333333', 'Manzana'), drink('44444444-4444-4444-8444-444444444444', 'Pera')];

describe('registrar aumento (US-50 CA-2)', () => {
  let fake: FakeStockUnitOfWork;
  let service: StockService;
  const row = (id: string) => fake.state.items.find((item) => item.id === id);

  beforeEach(() => {
    fake = createFakeStockUnitOfWork();
    fake.state.items.push(...[CARNE, POLLO, MANZANA, PERA].map((item) => ({ ...item })));
    service = createStockService({ unitOfWork: fake });
  });

  it('aumenta costo y todos los precios de lo tildado, al centavo, y lo audita', async () => {
    expect(await service.applyIncrease(CALLER, { menuItemIds: [CARNE.id], costPercent: 10, pricePercent: 10 })).toEqual({ updated: 1 });
    expect(row(CARNE.id)).toMatchObject({ unitCost: '1100.00', price1: '3025.00', price3: '8250.00', price6: '15400.00', price12: '28600.00', version: 2 });
    expect(row(POLLO.id)).toMatchObject({ price1: '2500.00', version: 1 });
    expect(fake.state.audits).toMatchObject([{ action: 'ACTUALIZAR', entity: 'MENU_ITEM', entityId: CARNE.id, detail: { name: 'Carne', costPercent: 10, pricePercent: 10, before: { price1: '2750.00' }, after: { price1: '3025.00' } } }]);
  });

  it('sólo el precio: el costo no cambia, y un costo nulo queda nulo', async () => {
    await service.applyIncrease(CALLER, { menuItemIds: [CARNE.id, POLLO.id], costPercent: 20, pricePercent: null });
    expect([row(CARNE.id)?.unitCost, row(CARNE.id)?.price1, row(POLLO.id)?.unitCost, row(POLLO.id)?.version]).toEqual(['1200.00', '2750.00', null, 1]);
  });

  it('una bebida arrastra a toda su familia, aunque llegue un solo sabor (US-49)', async () => {
    expect(await service.applyIncrease(CALLER, { menuItemIds: [MANZANA.id], costPercent: null, pricePercent: 20 })).toEqual({ updated: 2 });
    expect([row(MANZANA.id)?.price1, row(PERA.id)?.price1]).toEqual(['3000.00', '3000.00']);
  });

  it('NOT_FOUND si un producto ya no existe, sin cambiar nada', async () => {
    await expect(service.applyIncrease(CALLER, { menuItemIds: ['55555555-5555-4555-8555-555555555555'], costPercent: 10, pricePercent: null })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
