import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { asUser, TEST_USER_IDS } from '@/test/as-user';
import { cookieJar } from '@/test/cookie-jar';
import { fakeCheckout } from '../testing/fake-checkout-unit-of-work';
import { checkoutOf, COCA, cokes, loadMenu, stockOf } from '../testing/checkout-fixtures';
import { checkoutAction } from './checkout';
import { fetchSaleHistory } from './fetch-sale-history';
import { voidSaleAction } from './void-sale';

vi.mock('@/features/order/repository/checkout-unit-of-work', async () => {
  const { fakeCheckout: fake } = await import('../testing/fake-checkout-unit-of-work');
  return { drizzleCheckoutUnitOfWork: fake };
});
vi.mock('@/features/order/repository/sale-history-unit-of-work', async () => {
  const { fakeSaleHistory: fake } = await import('../testing/fake-sale-history');
  return { drizzleSaleHistoryUnitOfWork: fake };
});

async function sellTwoCokes(): Promise<string> {
  await asUser({ role: 'vendedor' });
  const result = await checkoutAction(checkoutOf([cokes(2)], { buyerName: 'Rocío', payments: [{ type: 'debito', amount: 5000 }] }));
  if (!result.success) throw new Error(result.error);
  return result.data.saleId;
}

describe('historial y anulación de ventas (US-7)', () => {
  beforeEach(() => {
    loadMenu(fakeCheckout);
    fakeCheckout.stock.state.usernames.set(TEST_USER_IDS.vendedor, 'vendedor');
  });

  it('el vendedor ve el historial, con importes como números y sin costos', async () => {
    const saleId = await sellTwoCokes();
    const [sale] = await fetchSaleHistory();
    expect(sale).toMatchObject({ id: saleId, buyerName: 'Rocío', vendorName: 'vendedor', total: 5000, payments: [{ type: 'debito', amount: 5000 }], lines: [{ group: 'coca_cola', quantity: 2, unitPrice: 2500, subtotal: 5000, description: 'Coca 500' }] });
    expect(JSON.stringify(sale)).not.toMatch(/unitCost|cost/i);
  });

  it('sin sesión el historial viene vacío', async () => {
    await sellTwoCokes();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    cookieJar.clear();
    expect(await fetchSaleHistory()).toEqual([]);
  });

  it('el admin anula: el stock vuelve y la venta sale del historial (CA-3)', async () => {
    const saleId = await sellTwoCokes();
    await asUser({ role: 'admin' });
    expect(await voidSaleAction({ saleId })).toEqual({ success: true, message: 'Venta anulada y stock repuesto.' });
    expect(stockOf(fakeCheckout, COCA.id)).toBe('5.0');
    expect(await fetchSaleHistory()).toEqual([]);
  });

  it.each([
    { caso: 'FORBIDDEN: el vendedor no anula', role: 'vendedor' as const, input: 'venta', code: 'FORBIDDEN', error: 'Solo los administradores pueden realizar esta acción' },
    { caso: 'NOT_FOUND: venta inexistente', role: 'admin' as const, input: '20000000-0000-4000-8000-0000000000ff', code: 'NOT_FOUND', error: 'El/la venta seleccionado ya no existe.' },
    { caso: 'VALIDATION: id inválido', role: 'admin' as const, input: 'x', code: 'VALIDATION', error: MESSAGES.ERROR.VALIDATION.INVALID_DATA },
  ])('$caso (CA-4)', async ({ role, input, code, error }) => {
    const saleId = await sellTwoCokes();
    await asUser({ role });
    expect(await voidSaleAction({ saleId: input === 'venta' ? saleId : input })).toEqual({ success: false, code, error });
    expect(stockOf(fakeCheckout, COCA.id)).toBe('3.0');
  });

  it('fuzz: ninguna entrada hace lanzar ni devuelve un error fuera del catálogo', async () => {
    await asUser({ role: 'admin' });
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(voidSaleAction, undefined, [input]);
        expect(result.success || ['VALIDATION', 'NOT_FOUND'].includes(result.code ?? '')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
