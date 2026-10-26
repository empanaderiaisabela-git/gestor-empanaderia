import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { asUser, TEST_USER_IDS } from '@/test/as-user';
import { fakeCheckout } from '../testing/fake-checkout-unit-of-work';
import { CARNE, checkoutOf, cokes, halfAndHalf, halfDozen, loadMenu, MEDIA_Y_COCA, promoOf } from '../testing/checkout-fixtures';
import { checkoutAction } from './checkout';

vi.mock('@/features/order/repository/checkout-unit-of-work', async () => {
  const { fakeCheckout: fake } = await import('../testing/fake-checkout-unit-of-work');
  return { drizzleCheckoutUnitOfWork: fake };
});

const ORDER = checkoutOf([halfDozen, halfAndHalf], { payments: [{ type: 'efectivo', amount: 10000 }, { type: 'transferencia', amount: 8000 }] });

describe('acción de cobro (US-6)', () => {
  beforeEach(() => loadMenu(fakeCheckout));

  it('el vendedor cobra: la venta queda a su nombre con el total del servidor', async () => {
    await asUser({ role: 'vendedor' });
    const result = await checkoutAction(ORDER);
    expect(result).toEqual({ success: true, message: 'Venta registrada por $18.000', data: { saleId: fakeCheckout.sales[0].id, total: 18000 } });
    expect(fakeCheckout.sales[0]).toMatchObject({ vendorId: TEST_USER_IDS.vendedor, buyerName: null });
  });

  it('UNAUTHENTICATED: sin sesión no se cobra', async () => {
    expect(await checkoutAction(ORDER)).toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(fakeCheckout.sales).toEqual([]);
  });

  it('un precio, costo o total mandado desde el navegador no cambia lo que se guarda (CA-2)', async () => {
    await asUser({ role: 'vendedor' });
    const tampered = [{ ...ORDER, total: 1 }, { ...ORDER, lines: [{ ...halfDozen, unitPrice: 1 }] }, { ...ORDER, lines: [{ ...halfDozen, flavors: [{ menuItemId: CARNE.id, units: 6, unitCost: 0 }] }] }];
    for (const input of tampered) expect(await Reflect.apply(checkoutAction, undefined, [input])).toMatchObject({ code: 'VALIDATION' });
    expect(await checkoutAction({ ...ORDER, payments: [{ type: 'efectivo', amount: 100 }] })).toMatchObject({ code: 'VALIDATION' });
    expect(fakeCheckout.sales).toEqual([]);
  });

  it.each([
    { caso: 'VALIDATION: línea incompleta', input: checkoutOf([{ ...halfDozen, flavors: [{ menuItemId: CARNE.id, units: 5 }] }], { payments: [{ type: 'efectivo', amount: 8000 }] }), code: 'VALIDATION', error: MESSAGES.ERROR.VALIDATION.INVALID_DATA },
    { caso: 'NOT_FOUND: gusto borrado', input: checkoutOf([{ ...cokes(1), flavors: [{ menuItemId: '10000000-0000-4000-8000-0000000000ff', units: 1 }] }], { payments: [{ type: 'efectivo', amount: 2500 }] }), code: 'NOT_FOUND', error: 'El/la producto seleccionado ya no existe.' },
    { caso: 'INSUFFICIENT_STOCK: no alcanza', input: checkoutOf([cokes(6)], { payments: [{ type: 'transferencia', amount: 15000 }] }), code: 'INSUFFICIENT_STOCK', error: 'No hay stock suficiente de Coca 500.' },
  ])('$caso', async ({ input, code, error }) => {
    await asUser({ role: 'vendedor' });
    expect(await checkoutAction(input)).toEqual({ success: false, code, error });
  });

  it('cobra una promo con el precio de la base y avisa si la promo ya no está (US-9 CA-3 y CA-4)', async () => {
    await asUser({ role: 'vendedor' });
    const { id } = await fakeCheckout.promotions.read.insert(MEDIA_Y_COCA);
    const pay = [{ type: 'efectivo' as const, amount: 9000 }];
    expect(await checkoutAction(checkoutOf([], { promos: [promoOf(id)], payments: pay }))).toMatchObject({ success: true, message: 'Venta registrada por $9.000' });
    expect(await checkoutAction(checkoutOf([], { promos: [promoOf(crypto.randomUUID())], payments: pay }))).toEqual({ success: false, code: 'NOT_FOUND', error: 'El/la promoción seleccionado ya no existe.' });
  });

  it('fuzz: ninguna entrada hace lanzar ni devuelve un error fuera del catálogo', async () => {
    await asUser({ role: 'vendedor' });
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(checkoutAction, undefined, [input]);
        expect(result.success).toBe(false);
        expect(result.success || result.code === 'VALIDATION').toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
