import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { fakeCheckout } from '../testing/fake-checkout-unit-of-work';
import { buyerOf, checkoutOf, halfDozen, loadMenu } from '../testing/checkout-fixtures';
import { checkoutAction } from './checkout';

vi.mock('@/features/order/repository/checkout-unit-of-work', async () => {
  const { fakeCheckout: fake } = await import('../testing/fake-checkout-unit-of-work');
  return { drizzleCheckoutUnitOfWork: fake };
});

const withShipping = (shippingOptionId: string, address = 'Mitre 123') => ({ ...checkoutOf([halfDozen], { buyer: buyerOf('Marta', { address }), payments: [{ type: 'efectivo', amount: 9500 }] }), shippingOptionId });

describe('cobro con envío por la acción (US-59 CA-2 y CA-3)', () => {
  let centro: string;

  beforeEach(async () => {
    loadMenu(fakeCheckout);
    centro = (await fakeCheckout.shippings.read.insert({ title: 'Centro', detail: '', amount: 1500 })).id;
    await asUser({ role: 'vendedor' });
  });

  it('el vendedor cobra el pedido con el envío que calcula el servidor', async () => {
    expect(await checkoutAction(withShipping(centro))).toMatchObject({ success: true, message: 'Venta registrada por $9.500', data: { total: 9500 } });
  });

  it('VALIDATION con envío y sin domicilio; NOT_FOUND con un envío desactivado', async () => {
    expect(await checkoutAction(withShipping(centro, ''))).toMatchObject({ success: false, code: 'VALIDATION' });
    await fakeCheckout.shippings.read.update({ id: centro, version: 1 }, { isActive: false });
    expect(await checkoutAction(withShipping(centro))).toEqual({ success: false, code: 'NOT_FOUND', error: 'El envío ya no existe.' });
    expect(fakeCheckout.sales).toHaveLength(0);
  });

  it('cualquier valor de envío devuelve un ActionResult y nunca lanza (fuzz)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (shippingOptionId) => {
        const result = await Reflect.apply(checkoutAction, undefined, [{ ...withShipping(centro), shippingOptionId }]);
        expect(result.success || ['VALIDATION', 'NOT_FOUND'].includes(result.code ?? '')).toBe(true);
      }),
      { numRuns: 40 }
    );
  });
});
