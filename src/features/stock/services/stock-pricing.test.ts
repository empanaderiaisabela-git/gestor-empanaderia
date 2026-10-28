import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeStockUnitOfWork, type FakeStockUnitOfWork } from '../testing/fake-stock-unit-of-work';
import { stockItem } from '../testing/stock-item';
import { createStockService, type StockService } from './stock.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };
const DOZEN = { price1: '3000.00', price3: '8500.00', price6: '16500.00', price12: '32000.00' };
const RAISED = { price1: 3200, price3: 9000, price6: 17500, price12: 34000 };

describe('Costo y precio de un gusto, sin cantidad (US-28 CA-5)', () => {
  let fake: FakeStockUnitOfWork;
  let service: StockService;
  const carne = stockItem({ id: '11111111-1111-4111-8111-111111111111', name: 'Carne', ...DOZEN });
  const pollo = stockItem({ id: '22222222-2222-4222-8222-222222222222', name: 'Pollo', unitCost: '350.00', ...DOZEN });
  const humita = stockItem({ id: '33333333-3333-4333-8333-333333333333', name: 'Humita', isActive: false });
  const muzza = stockItem({ id: '44444444-4444-4444-8444-444444444444', group: 'pizzas', name: 'Muzza', stock: '2.5', price1: '11000.00' });

  beforeEach(() => {
    fake = createFakeStockUnitOfWork();
    fake.state.items.push(...[carne, pollo, humita, muzza].map((item) => ({ ...item })));
    service = createStockService({ unitOfWork: fake });
  });

  it('guarda costo y precios del gusto, sube su versión, no toca el stock y lo audita', async () => {
    const { item, applied } = await service.setPricing(CALLER, { menuItemId: carne.id, version: 1, unitCost: 420, prices: RAISED, applyToGroup: false });
    expect(item).toMatchObject({ stock: '10.0', unitCost: '420.00', price12: '34000.00', version: 2 });
    expect(applied).toBe(0);
    expect(fake.state.items.find((row) => row.id === pollo.id)).toMatchObject({ price12: '32000.00', version: 1 });
    expect(fake.state.audits).toEqual([{ userId: CALLER.id, action: 'ACTUALIZAR', entity: 'MENU_ITEM', entityId: carne.id, detail: { name: 'Carne', unitCost: 420, prices: RAISED, appliedTo: 0 } }]);
  });

  it('aplicar a todos copia sólo los precios a los demás gustos del grupo, también los inactivos, y sube cada versión', async () => {
    const { applied } = await service.setPricing(CALLER, { menuItemId: carne.id, version: 1, unitCost: 420, prices: RAISED, applyToGroup: true });
    expect(applied).toBe(2);
    expect(fake.state.items.find((row) => row.id === pollo.id)).toMatchObject({ unitCost: '350.00', price1: '3200.00', price12: '34000.00', version: 2 });
    expect(fake.state.items.find((row) => row.id === humita.id)).toMatchObject({ unitCost: '400.00', price12: '34000.00', version: 2 });
    expect(fake.state.items.find((row) => row.id === muzza.id)).toMatchObject({ price1: '11000.00', version: 1 });
    expect(fake.state.audits[0].detail).toMatchObject({ appliedTo: 2 });
  });

  it('ciabattas y pizzas llevan sólo el precio de unidad', async () => {
    await expect(service.setPricing(CALLER, { menuItemId: muzza.id, version: 1, unitCost: 4000, prices: { price1: 12000 }, applyToGroup: true })).resolves.toMatchObject({ item: { price1: '12000.00', stock: '2.5' }, applied: 0 });
  });

  it('VALIDATION: precios que no corresponden al grupo; no guarda nada', async () => {
    await expect(service.setPricing(CALLER, { menuItemId: carne.id, version: 1, unitCost: 420, prices: { price1: 3000 }, applyToGroup: true })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(service.setPricing(CALLER, { menuItemId: muzza.id, version: 1, unitCost: 1, prices: { price1: 1, price6: 6 }, applyToGroup: false })).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(fake.state.items.every((row) => row.version === 1)).toBe(true);
    expect(fake.state.audits).toEqual([]);
  });

  it('STALE_VERSION: el gusto cambió desde que se abrió el formulario', async () => {
    await expect(service.setPricing(CALLER, { menuItemId: carne.id, version: 7, unitCost: 420, prices: RAISED, applyToGroup: true })).rejects.toMatchObject({ code: 'STALE_VERSION' });
    expect(fake.state.items.find((row) => row.id === pollo.id)).toMatchObject({ price12: '32000.00', version: 1 });
  });

  it('NOT_FOUND: el gusto ya no existe', async () => {
    await expect(service.setPricing(CALLER, { menuItemId: '55555555-5555-4555-8555-555555555555', version: 1, unitCost: 1, prices: { price1: 1 }, applyToGroup: false })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'El producto ya no existe.' });
  });
});
