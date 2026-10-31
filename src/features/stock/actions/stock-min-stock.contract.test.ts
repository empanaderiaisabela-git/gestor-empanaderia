import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser, TEST_USER_IDS } from '@/test/as-user';
import { fakeStock } from '../testing/fake-stock-unit-of-work';
import { stockItem } from '../testing/stock-item';
import { registerStockEntryAction } from './register-stock-entry';

vi.mock('@/features/stock/repository/stock-unit-of-work', async () => {
  const { fakeStock: fake } = await import('../testing/fake-stock-unit-of-work');
  return { drizzleStockUnitOfWork: fake };
});

const ITEM = stockItem({ id: '11111111-1111-4111-8111-111111111111', price1: '1200.00', price3: '3400.00', price6: '6500.00', price12: '12000.00' });

describe('stock mínimo por la acción de ingresar stock (US-45 CA-2)', () => {
  beforeEach(async () => {
    fakeStock.reset();
    fakeStock.state.items.push({ ...ITEM });
    fakeStock.state.usernames.set(TEST_USER_IDS.admin, 'admin');
    await asUser({ role: 'admin' });
  });

  it('el admin guarda el mínimo junto con el ingreso', async () => {
    expect(await registerStockEntryAction({ menuItemId: ITEM.id, quantity: 2, minStock: 5 })).toMatchObject({ success: true, data: { stock: 12 } });
    expect(fakeStock.state.items[0].minStock).toBe(5);
  });

  it('VALIDATION: un mínimo de 0, con decimales o enorme no se guarda', async () => {
    for (const minStock of [0, 2.5, 100_001]) expect(await registerStockEntryAction({ menuItemId: ITEM.id, quantity: 1, minStock })).toMatchObject({ success: false, code: 'VALIDATION' });
    expect(fakeStock.state.items[0]).toMatchObject({ stock: '10.0', minStock: null });
  });

  it('FORBIDDEN: el vendedor no carga mínimos', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await asUser({ role: 'vendedor' });
    expect(await registerStockEntryAction({ menuItemId: ITEM.id, quantity: 1, minStock: 5 })).toMatchObject({ code: 'FORBIDDEN' });
  });

  it('cualquier mínimo devuelve un ActionResult y nunca lanza (fuzz)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (minStock) => {
        const result = await Reflect.apply(registerStockEntryAction, undefined, [{ menuItemId: ITEM.id, quantity: 1, minStock }]);
        expect(typeof result.success).toBe('boolean');
      }),
      { numRuns: 50 }
    );
  });
});
