import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { fakeCheckout } from '../testing/fake-checkout-unit-of-work';
import { buyerOf, checkoutOf, CLIENTE, cokes, loadMenu } from '../testing/checkout-fixtures';
import { checkoutAction } from './checkout';

vi.mock('@/features/order/repository/checkout-unit-of-work', async () => {
  const { fakeCheckout: fake } = await import('../testing/fake-checkout-unit-of-work');
  return { drizzleCheckoutUnitOfWork: fake };
});

const sell = (buyer: ReturnType<typeof buyerOf>) => checkoutAction(checkoutOf([cokes(1)], { buyer, payments: [{ type: 'efectivo', amount: 2500 }] }));

describe('el cliente en la acción de cobro (US-37)', () => {
  beforeEach(async () => {
    loadMenu(fakeCheckout);
    await asUser({ role: 'vendedor' });
  });

  it('un cliente nuevo se da de alta y uno elegido se vincula', async () => {
    expect(await sell(buyerOf('Rocío', { phone: '11 5555-1234' }))).toMatchObject({ success: true });
    expect(await sell(buyerOf('Marta', { customerId: CLIENTE.id }))).toMatchObject({ success: true });
    expect(fakeCheckout.customers.map((customer) => customer.name)).toEqual(['Marta', 'Rocío']);
    expect(fakeCheckout.sales.map((sale) => sale.customerId)).toEqual([fakeCheckout.customers[1].id, CLIENTE.id]);
  });

  it('VALIDATION sin nombre del cliente, y NOT_FOUND con un cliente desactivado', async () => {
    expect(await sell(buyerOf('  '))).toMatchObject({ success: false, code: 'VALIDATION' });
    fakeCheckout.customers[0].isActive = false;
    expect(await sell(buyerOf('Marta', { customerId: CLIENTE.id }))).toMatchObject({ success: false, code: 'NOT_FOUND', error: 'El cliente ya no existe.' });
    expect(fakeCheckout.sales).toEqual([]);
  });
});
