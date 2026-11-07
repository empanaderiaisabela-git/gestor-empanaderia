import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { fakeCheckout } from '../testing/fake-checkout-unit-of-work';
import { checkoutOf, halfDozen, loadMenu } from '../testing/checkout-fixtures';
import { checkoutAction } from './checkout';
import { completeSalePaymentAction } from './complete-sale-payment';

vi.mock('@/features/order/repository/checkout-unit-of-work', async () => {
  const { fakeCheckout: fake } = await import('../testing/fake-checkout-unit-of-work');
  return { drizzleCheckoutUnitOfWork: fake };
});
vi.mock('@/features/order/repository/sale-payment-unit-of-work', async () => {
  const { fakeSalePayment } = await import('../testing/fake-sale-payment');
  return { drizzleSalePaymentUnitOfWork: fakeSalePayment };
});

const cash = (amount: number) => [{ type: 'efectivo' as const, amount }];

describe('completar el pago por la acción (US-69)', () => {
  let saleId: string;

  beforeEach(async () => {
    loadMenu(fakeCheckout);
    await asUser({ role: 'vendedor' });
    const result = await checkoutAction(checkoutOf([halfDozen]));
    saleId = result.success ? result.data.saleId : '';
  });

  it('el vendedor completa una venta pendiente (D-4)', async () => {
    expect(await completeSalePaymentAction({ saleId, discountPercentage: 0, discountAmount: 0, payments: cash(8000) })).toEqual({ success: true, message: 'Pago completado por $8.000', data: { saleId, total: 8000 } });
  });

  it('VALIDATION sin medios de pago; STALE_VERSION si ya se completó', async () => {
    expect(await completeSalePaymentAction({ saleId, discountPercentage: 0, discountAmount: 0, payments: [] })).toMatchObject({ success: false, code: 'VALIDATION' });
    await completeSalePaymentAction({ saleId, discountPercentage: 0, discountAmount: 0, payments: cash(8000) });
    expect(await completeSalePaymentAction({ saleId, discountPercentage: 0, discountAmount: 0, payments: cash(8000) })).toMatchObject({ success: false, code: 'STALE_VERSION' });
  });

  it('UNAUTHENTICATED sin sesión', async () => {
    vi.restoreAllMocks();
    const { cookieJar } = await import('@/test/cookie-jar');
    cookieJar.clear();
    expect(await completeSalePaymentAction({ saleId, discountPercentage: 0, discountAmount: 0, payments: cash(8000) })).toMatchObject({ success: false, code: 'UNAUTHENTICATED' });
  });

  it('fuzz: ninguna entrada hace lanzar ni devuelve un error fuera del catálogo', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(completeSalePaymentAction, undefined, [input]);
        expect(result.success || ['VALIDATION', 'NOT_FOUND', 'STALE_VERSION'].includes(result.code ?? '')).toBe(true);
      }),
      { numRuns: 60 }
    );
  });
});
