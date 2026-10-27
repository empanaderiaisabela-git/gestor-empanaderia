import { beforeEach, describe, expect, it } from 'vitest';
import type { StockUnitOfWork } from '@/features/stock/repository/stock-unit-of-work';
import { createFakeStockUnitOfWork, type FakeStockUnitOfWork } from '../testing/fake-stock-unit-of-work';
import { groupPriceRow, stockItem } from '../testing/stock-item';
import { createStockService, type StockService } from './stock.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };
const EMPANADA_PRICES = { price1: 1300, price3: 3600, price6: 7000, price12: 13000 };
const bare = (overrides = {}) => stockItem({ id: crypto.randomUUID(), group: 'pizzas', name: 'Napolitana', unitCost: null, stock: '0.0', ...overrides });

describe('stock.service: costo y precio al ingresar (US-17)', () => {
  let fake: FakeStockUnitOfWork;
  let service: StockService;

  beforeEach(() => {
    fake = createFakeStockUnitOfWork();
    service = createStockService({ unitOfWork: fake });
  });

  it('MISSING_COST: el primer ingreso sin costo no guarda nada', async () => {
    const item = bare();
    fake.state.items.push(item);
    await expect(service.registerEntry(CALLER, { menuItemId: item.id, quantity: 6, prices: { price1: 11000 } })).rejects.toMatchObject({ code: 'MISSING_COST', message: 'Falta el costo para el local.' });
    expect(fake.state.items[0]).toMatchObject({ stock: '0.0', version: 1 });
  });

  it('MISSING_PRICE: un gusto sin precio, con costo, pide el precio', async () => {
    const item = bare();
    fake.state.items.push(item);
    await expect(service.registerEntry(CALLER, { menuItemId: item.id, quantity: 6, unitCost: 3000 })).rejects.toMatchObject({ code: 'MISSING_PRICE', message: 'Falta el precio de venta.' });
    expect(fake.state.entries).toEqual([]);
  });

  it('el primer ingreso con costo y precio guarda todo junto y lo audita', async () => {
    const item = bare();
    fake.state.items.push(item);
    const { item: saved } = await service.registerEntry(CALLER, { menuItemId: item.id, quantity: 6, unitCost: 3000, prices: { price1: 11000 } });
    expect(saved).toMatchObject({ stock: '6.0', unitCost: '3000.00', price1: '11000.00', version: 2 });
    expect(fake.state.audits[0].detail).toMatchObject({ unitCost: 3000, prices: { price1: 11000 } });
  });

  it('un ingreso posterior sin costo ni precios conserva los actuales', async () => {
    const item = bare({ unitCost: '3000.00', price1: '11000.00' });
    fake.state.items.push(item);
    const { item: saved } = await service.registerEntry(CALLER, { menuItemId: item.id, quantity: 2 });
    expect(saved).toMatchObject({ unitCost: '3000.00', price1: '11000.00' });
  });

  it('un ingreso con precios nuevos cambia el precio del gusto', async () => {
    const item = bare({ unitCost: '3000.00', price1: '11000.00' });
    fake.state.items.push(item);
    const { item: saved } = await service.registerEntry(CALLER, { menuItemId: item.id, quantity: 2, prices: { price1: 12000 } });
    expect(saved).toMatchObject({ price1: '12000.00' });
  });

  it('VALIDATION: una presentación que el grupo no vende, o con faltantes', async () => {
    const pizza = bare({ unitCost: '3000.00' });
    const sanguche = bare({ group: 'sanguches', name: 'Primavera', unitCost: '500.00' });
    fake.state.items.push(pizza, sanguche);
    await expect(service.registerEntry(CALLER, { menuItemId: pizza.id, quantity: 1, prices: { price1: 1, price6: 6 } })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(service.registerEntry(CALLER, { menuItemId: sanguche.id, quantity: 1, prices: { price1: 1 } })).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('empanadas: el primer precio crea la fila del grupo y el siguiente la actualiza con su versión', async () => {
    const item = stockItem({ unitCost: '400.00' });
    fake.state.items.push(item);
    await service.registerEntry(CALLER, { menuItemId: item.id, quantity: 1, prices: EMPANADA_PRICES });
    expect(fake.state.groupPrices).toMatchObject([{ group: 'empanadas', price1: '1300.00', price12: '13000.00', version: 1 }]);
    await service.registerEntry(CALLER, { menuItemId: item.id, quantity: 1, prices: { ...EMPANADA_PRICES, price1: 1400 } });
    expect(fake.state.groupPrices).toMatchObject([{ price1: '1400.00', version: 2 }]);
    expect(fake.state.items[0]).toMatchObject({ price1: null });
  });

  it('empanadas: MISSING_PRICE si el grupo no tiene precio y no se manda; con precio del grupo alcanza', async () => {
    const item = stockItem({ unitCost: '400.00' });
    fake.state.items.push(item);
    await expect(service.registerEntry(CALLER, { menuItemId: item.id, quantity: 1 })).rejects.toMatchObject({ code: 'MISSING_PRICE' });
    fake.state.groupPrices.push(groupPriceRow());
    await expect(service.registerEntry(CALLER, { menuItemId: item.id, quantity: 1 })).resolves.toMatchObject({ item: { stock: '11.0' } });
  });

  it('empanadas: VALIDATION si el precio no es de cuatro presentaciones', async () => {
    const item = stockItem({ unitCost: '400.00' });
    fake.state.items.push(item);
    await expect(service.registerEntry(CALLER, { menuItemId: item.id, quantity: 1, prices: { price1: 1300 } })).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('STALE_VERSION: alguien cambió el precio del grupo a la vez', async () => {
    const item = stockItem({ unitCost: '400.00' });
    fake.state.items.push(item);
    fake.state.groupPrices.push(groupPriceRow({ version: 3 }));
    const racing: StockUnitOfWork = { read: fake.read, run: (work) => fake.run((scope) => work({ ...scope, groupPrices: { ...scope.groupPrices, findAll: async () => [groupPriceRow({ version: 2 })] } })) };
    await expect(createStockService({ unitOfWork: racing }).registerEntry(CALLER, { menuItemId: item.id, quantity: 1, prices: EMPANADA_PRICES })).rejects.toMatchObject({ code: 'STALE_VERSION' });
  });
});
