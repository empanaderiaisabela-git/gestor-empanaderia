import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser, TEST_USER_IDS } from '@/test/as-user';
import { fakeStock } from '../testing/fake-stock-unit-of-work';
import { stockItem } from '../testing/stock-item';
import { fetchStockEntries } from './fetch-stock-entries';
import { registerStockEntryAction } from './register-stock-entry';
import { updateStockEntryAction } from './update-stock-entry';

vi.mock('@/features/stock/repository/stock-unit-of-work', async () => {
  const { fakeStock: fake } = await import('../testing/fake-stock-unit-of-work');
  return { drizzleStockUnitOfWork: fake };
});

const ITEM = stockItem({ id: '11111111-1111-4111-8111-111111111111', price1: '1200.00', price3: '3400.00', price6: '6500.00', price12: '12000.00' });
const PROVIDER = '22222222-2222-4222-8222-222222222222';

describe('editar un ingreso por la acción (US-46 CA-4)', () => {
  let entryId: string;

  beforeEach(async () => {
    fakeStock.reset();
    fakeStock.state.items.push({ ...ITEM });
    fakeStock.state.usernames.set(TEST_USER_IDS.admin, 'admin');
    fakeStock.state.providerNames.set(PROVIDER, 'Molino del Sur');
    await asUser({ role: 'admin' });
    await registerStockEntryAction({ menuItemId: ITEM.id, quantity: 12, unitCost: 450 });
    entryId = fakeStock.state.entries[0].id;
  });

  it('el admin corrige la cantidad y suma el proveedor; el historial lo muestra con su versión', async () => {
    expect(await updateStockEntryAction({ id: entryId, version: 1, menuItemId: ITEM.id, quantity: 10, unitCost: 450, providerId: PROVIDER })).toEqual({ success: true, message: 'Ingreso actualizado: Carne suave queda con 20', data: { menuItemId: ITEM.id, stock: 20, version: 3 } });
    expect(await fetchStockEntries(ITEM.id)).toMatchObject([{ id: entryId, quantity: 10, providerId: PROVIDER, providerName: 'Molino del Sur', version: 2 }]);
  });

  it('STALE_VERSION: si otro lo editó antes, la segunda edición no se guarda', async () => {
    await updateStockEntryAction({ id: entryId, version: 1, menuItemId: ITEM.id, quantity: 10 });
    expect(await updateStockEntryAction({ id: entryId, version: 1, menuItemId: ITEM.id, quantity: 8 })).toMatchObject({ success: false, code: 'STALE_VERSION' });
    expect(fakeStock.state.items[0].stock).toBe('20.0');
  });

  it('FORBIDDEN: el vendedor no edita ingresos', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await asUser({ role: 'vendedor' });
    expect(await updateStockEntryAction({ id: entryId, version: 1, menuItemId: ITEM.id, quantity: 1 })).toMatchObject({ code: 'FORBIDDEN' });
  });

  it('VALIDATION sin versión o con campos de más, y nunca lanza (fuzz)', async () => {
    expect(await Reflect.apply(updateStockEntryAction, undefined, [{ id: entryId, menuItemId: ITEM.id, quantity: 1 }])).toMatchObject({ code: 'VALIDATION' });
    expect(await Reflect.apply(updateStockEntryAction, undefined, [{ id: entryId, version: 1, menuItemId: ITEM.id, quantity: 1, stock: 99 }])).toMatchObject({ code: 'VALIDATION' });
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(updateStockEntryAction, undefined, [input]);
        expect(typeof result.success).toBe('boolean');
      }),
      { numRuns: 50 }
    );
  });
});
