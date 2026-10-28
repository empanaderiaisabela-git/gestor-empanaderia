import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { asUser, TEST_USER_IDS } from '@/test/as-user';
import { fakeStock } from '../testing/fake-stock-unit-of-work';
import { stockItem } from '../testing/stock-item';
import { fetchStockEntries } from './fetch-stock-entries';
import { registerStockEntryAction } from './register-stock-entry';
import { registerStockLossAction } from './register-stock-loss';

vi.mock('@/features/stock/repository/stock-unit-of-work', async () => {
  const { fakeStock: fake } = await import('../testing/fake-stock-unit-of-work');
  return { drizzleStockUnitOfWork: fake };
});

const ITEM = stockItem({ id: '11111111-1111-4111-8111-111111111111', price1: '1200.00', price3: '3400.00', price6: '6500.00', price12: '12000.00' });
const PROVIDER = '22222222-2222-4222-8222-222222222222';
const [PIZZA_ID, BASE_ID] = ['66666666-6666-4666-8666-666666666666', '77777777-7777-4777-8777-777777777777'];

describe('acciones de Stock (US-4)', () => {
  beforeEach(() => {
    fakeStock.reset();
    fakeStock.state.items.push({ ...ITEM });
    fakeStock.state.usernames.set(TEST_USER_IDS.admin, 'admin').set(TEST_USER_IDS.vendedor, 'vendedor');
    fakeStock.state.providerNames.set(PROVIDER, 'Molino del Sur');
  });

  it('el admin ingresa con costo y proveedor; el historial muestra todo', async () => {
    await asUser({ role: 'admin' });
    expect(await registerStockEntryAction({ menuItemId: ITEM.id, quantity: 12, unitCost: 450, providerId: PROVIDER })).toEqual({ success: true, message: 'Stock ingresado: Carne suave queda con 22', data: { menuItemId: ITEM.id, stock: 22, version: 2 } });
    expect(await fetchStockEntries(ITEM.id)).toMatchObject([{ quantity: 12, unitCost: 450, providerName: 'Molino del Sur', username: 'admin' }]);
  });

  it('MISSING_COST y MISSING_PRICE: un gusto nuevo sin costo ni precio no admite ingresos', async () => {
    await asUser({ role: 'admin' });
    const bare = stockItem({ id: '55555555-5555-4555-8555-555555555555', group: 'coca_cola', name: 'Coca 500', unitCost: null, stock: '0.0' });
    fakeStock.state.items.push(bare);
    expect(await registerStockEntryAction({ menuItemId: bare.id, quantity: 6 })).toEqual({ success: false, code: 'MISSING_COST', error: 'Falta el costo para el local.' });
    expect(await registerStockEntryAction({ menuItemId: bare.id, quantity: 6, unitCost: 3000 })).toEqual({ success: false, code: 'MISSING_PRICE', error: 'Falta el precio de venta.' });
    expect(await registerStockEntryAction({ menuItemId: bare.id, quantity: 6, unitCost: 3000, prices: { price1: 11000 } })).toMatchObject({ success: true, data: { stock: 6, version: 2 } });
  });

  it('FORBIDDEN: el vendedor no entra a Stock: no ingresa, no lee el historial ni registra mermas (US-16)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await asUser({ role: 'admin' });
    await registerStockEntryAction({ menuItemId: ITEM.id, quantity: 12, unitCost: 450, providerId: PROVIDER });
    await asUser({ role: 'vendedor' });
    expect(await registerStockEntryAction({ menuItemId: ITEM.id, quantity: 1 })).toMatchObject({ code: 'FORBIDDEN' });
    expect(await fetchStockEntries(ITEM.id)).toEqual([]);
    expect(await registerStockLossAction({ menuItemId: ITEM.id, quantity: 1, reason: 'x' })).toMatchObject({ code: 'FORBIDDEN' });
  });

  it('UNAUTHENTICATED: sin sesión no se ingresa ni se lee', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await registerStockEntryAction({ menuItemId: ITEM.id, quantity: 1 })).toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(await fetchStockEntries(ITEM.id)).toEqual([]);
  });

  it('VALIDATION: cantidad 0 o con decimales (CA-5)', async () => {
    await asUser({ role: 'admin' });
    expect(await registerStockEntryAction({ menuItemId: ITEM.id, quantity: 0 })).toEqual({ success: false, code: 'VALIDATION', error: MESSAGES.ERROR.VALIDATION.INVALID_DATA });
    expect(await registerStockLossAction({ menuItemId: ITEM.id, quantity: 0.5, reason: 'x' })).toMatchObject({ code: 'VALIDATION' });
  });

  it('VALIDATION: un gusto de pizza no recibe stock; la prepizza sí (US-29)', async () => {
    await asUser({ role: 'admin' });
    fakeStock.state.items.push(stockItem({ id: PIZZA_ID, group: 'pizzas', name: 'Muzza', price1: '11000.00' }), stockItem({ id: BASE_ID, group: 'pizzas', name: 'Prepizza', unitCost: null, stock: '0.0', isBase: true }));
    expect(await registerStockEntryAction({ menuItemId: PIZZA_ID, quantity: 2, unitCost: 3000 })).toEqual({ success: false, code: 'VALIDATION', error: MESSAGES.ERROR.VALIDATION.INVALID_DATA });
    expect(await registerStockEntryAction({ menuItemId: BASE_ID, quantity: 2 })).toMatchObject({ success: true, message: 'Stock ingresado: Prepizza queda con 2' });
  });

  it('NOT_FOUND: el gusto ya no existe (CA-5)', async () => {
    await asUser({ role: 'admin' });
    expect(await registerStockEntryAction({ menuItemId: '44444444-4444-4444-8444-444444444444', quantity: 1 })).toEqual({ success: false, code: 'NOT_FOUND', error: 'El producto ya no existe.' });
  });

  it('INSUFFICIENT_STOCK: la merma supera el stock (CA-5)', async () => {
    await asUser({ role: 'admin' });
    expect(await registerStockLossAction({ menuItemId: ITEM.id, quantity: 11, reason: 'Se cayó' })).toEqual({ success: false, code: 'INSUFFICIENT_STOCK', error: 'No hay stock suficiente de Carne suave.' });
    expect(await registerStockLossAction({ menuItemId: ITEM.id, quantity: 4, reason: 'Se cayó' })).toEqual({ success: true, message: 'Pérdida registrada: Carne suave queda con 6', data: { menuItemId: ITEM.id, stock: 6, version: 2 } });
  });

  it('fuzz: ninguna entrada hace lanzar ni devuelve un error fuera del catálogo', async () => {
    await asUser({ role: 'admin' });
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(registerStockEntryAction, undefined, [input]);
        expect(result.success || ['VALIDATION', 'NOT_FOUND'].includes(result.code ?? '')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
