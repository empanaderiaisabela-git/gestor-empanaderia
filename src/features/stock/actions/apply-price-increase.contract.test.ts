import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { fakeStock } from '../testing/fake-stock-unit-of-work';
import { stockItem } from '../testing/stock-item';
import { applyPriceIncreaseAction } from './apply-price-increase';

vi.mock('@/features/stock/repository/stock-unit-of-work', async () => {
  const { fakeStock: fake } = await import('../testing/fake-stock-unit-of-work');
  return { drizzleStockUnitOfWork: fake };
});

const ITEM = stockItem({ id: '11111111-1111-4111-8111-111111111111', unitCost: '1000.00', price1: '2750.00', price3: '7500.00', price6: '14000.00', price12: '26000.00' });

describe('registrar aumento por la acción (US-50)', () => {
  beforeEach(async () => {
    fakeStock.reset();
    fakeStock.state.items.push({ ...ITEM });
    await asUser({ role: 'admin' });
  });

  it('el admin aplica el aumento y recibe cuántos productos cambiaron', async () => {
    expect(await applyPriceIncreaseAction({ menuItemIds: [ITEM.id], costPercent: null, pricePercent: 10 })).toEqual({ success: true, message: 'Aumento aplicado a 1 producto', data: { updated: 1 } });
    expect(fakeStock.state.items[0].price1).toBe('3025.00');
  });

  it('FORBIDDEN para el vendedor; VALIDATION sin porcentajes o sin productos', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await applyPriceIncreaseAction({ menuItemIds: [ITEM.id], costPercent: null, pricePercent: null })).toMatchObject({ code: 'VALIDATION' });
    expect(await applyPriceIncreaseAction({ menuItemIds: [], costPercent: 5, pricePercent: null })).toMatchObject({ code: 'VALIDATION' });
    await asUser({ role: 'vendedor' });
    expect(await applyPriceIncreaseAction({ menuItemIds: [ITEM.id], costPercent: 5, pricePercent: null })).toMatchObject({ code: 'FORBIDDEN' });
    expect(fakeStock.state.items[0]).toMatchObject({ unitCost: '1000.00', version: 1 });
  });

  it('cualquier entrada devuelve un ActionResult y nunca lanza (fuzz)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        expect(typeof (await Reflect.apply(applyPriceIncreaseAction, undefined, [input])).success).toBe('boolean');
      }),
      { numRuns: 50 }
    );
  });
});
