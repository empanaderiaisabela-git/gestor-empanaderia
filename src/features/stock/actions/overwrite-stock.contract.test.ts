import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser, TEST_USER_IDS } from '@/test/as-user';
import { fakeStock } from '../testing/fake-stock-unit-of-work';
import { stockItem } from '../testing/stock-item';
import { fetchStockEntries } from './fetch-stock-entries';
import { overwriteStockAction } from './overwrite-stock';
import { registerStockEntryAction } from './register-stock-entry';

vi.mock('@/features/stock/repository/stock-unit-of-work', async () => {
  const { fakeStock: fake } = await import('../testing/fake-stock-unit-of-work');
  return { drizzleStockUnitOfWork: fake };
});

const ITEM = stockItem({ id: '11111111-1111-4111-8111-111111111111', price1: '1200.00', price3: '3400.00', price6: '6500.00', price12: '12000.00' });
const PROVIDER = '22222222-2222-4222-8222-222222222222';

describe('pisar el stock por la acción (US-70)', () => {
  let entry: { id: string; version: number };

  beforeEach(async () => {
    fakeStock.reset();
    fakeStock.state.items.push({ ...ITEM });
    fakeStock.state.usernames.set(TEST_USER_IDS.admin, 'admin');
    fakeStock.state.providerNames.set(PROVIDER, 'Molino del Sur');
    await asUser({ role: 'admin' });
    await registerStockEntryAction({ menuItemId: ITEM.id, quantity: 12, unitCost: 450 });
    entry = { id: fakeStock.state.entries[0].id, version: 1 };
  });

  it('el admin escribe el stock final y suma el proveedor; el ingreso conserva su cantidad', async () => {
    expect(await overwriteStockAction({ menuItemId: ITEM.id, itemVersion: 2, stock: 7, unitCost: 450, providerId: PROVIDER, entry })).toEqual({ success: true, message: 'Stock actualizado: Carne suave queda con 7', data: { menuItemId: ITEM.id, stock: 7, version: 3 } });
    expect(await fetchStockEntries(ITEM.id)).toMatchObject([{ id: entry.id, quantity: 12, providerId: PROVIDER, providerName: 'Molino del Sur', version: 2 }]);
  });

  it('STALE_VERSION: si el gusto cambió desde que se abrió, no se guarda', async () => {
    await overwriteStockAction({ menuItemId: ITEM.id, itemVersion: 2, stock: 10, entry: null });
    expect(await overwriteStockAction({ menuItemId: ITEM.id, itemVersion: 2, stock: 8, entry: null })).toMatchObject({ success: false, code: 'STALE_VERSION' });
    expect(fakeStock.state.items[0].stock).toBe('10.0');
  });

  it('FORBIDDEN: el vendedor no edita el stock', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await asUser({ role: 'vendedor' });
    expect(await overwriteStockAction({ menuItemId: ITEM.id, itemVersion: 2, stock: 1, entry: null })).toMatchObject({ code: 'FORBIDDEN' });
  });

  it('VALIDATION sin versión, con stock negativo o campos de más, y nunca lanza (fuzz)', async () => {
    expect(await Reflect.apply(overwriteStockAction, undefined, [{ menuItemId: ITEM.id, stock: 1, entry: null }])).toMatchObject({ code: 'VALIDATION' });
    expect(await overwriteStockAction({ menuItemId: ITEM.id, itemVersion: 2, stock: -1, entry: null })).toMatchObject({ code: 'VALIDATION' });
    expect(await Reflect.apply(overwriteStockAction, undefined, [{ menuItemId: ITEM.id, itemVersion: 2, stock: 1, entry: null, quantity: 99 }])).toMatchObject({ code: 'VALIDATION' });
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(overwriteStockAction, undefined, [input]);
        expect(typeof result.success).toBe('boolean');
      }),
      { numRuns: 50 }
    );
  });
});
