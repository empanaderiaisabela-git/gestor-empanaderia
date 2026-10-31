import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { fakeCheckout } from '../testing/fake-checkout-unit-of-work';
import { checkoutOf, halfAndHalf, loadMenu } from '../testing/checkout-fixtures';
import { checkoutAction } from './checkout';

vi.mock('@/features/order/repository/checkout-unit-of-work', async () => {
  const { fakeCheckout: fake } = await import('../testing/fake-checkout-unit-of-work');
  return { drizzleCheckoutUnitOfWork: fake };
});

const withHam = (amount: number) => checkoutOf([{ ...halfAndHalf, ham: true }], { payments: [{ type: 'efectivo', amount }] });

describe('cobro con jamón extra por la acción (US-47 CA-5)', () => {
  beforeEach(async () => {
    loadMenu(fakeCheckout);
    await asUser({ role: 'vendedor' });
  });

  it('el vendedor cobra la pizza con jamón al precio que calcula el servidor', async () => {
    await fakeCheckout.extras.read.saveHam({ price: 1500, version: 0 });
    expect(await checkoutAction(withHam(11500))).toMatchObject({ success: true, data: { total: 11500 } });
  });

  it('MISSING_PRICE sin precio de jamón; VALIDATION si el jamón no es sí o no', async () => {
    expect(await checkoutAction(withHam(11500))).toMatchObject({ success: false, code: 'MISSING_PRICE' });
    expect(await Reflect.apply(checkoutAction, undefined, [{ ...withHam(10000), lines: [{ ...halfAndHalf, ham: 'sí' }] }])).toMatchObject({ code: 'VALIDATION' });
  });

  it('cualquier valor de jamón devuelve un ActionResult y nunca lanza (fuzz)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (ham) => {
        const result = await Reflect.apply(checkoutAction, undefined, [{ ...withHam(10000), lines: [{ ...halfAndHalf, ham }] }]);
        expect(typeof result.success).toBe('boolean');
      }),
      { numRuns: 40 }
    );
  });
});
