import { beforeEach, describe, expect, it } from 'vitest';
import { isAppError } from '@/lib/errors';
import { createFakeCheckoutUnitOfWork } from '../testing/fake-checkout-unit-of-work';
import { buyerOf, CALLER, checkoutOf, CLIENTE, cokes, loadMenu } from '../testing/checkout-fixtures';
import { createCheckoutService } from './checkout.service';

const fake = createFakeCheckoutUnitOfWork();
const service = createCheckoutService({ unitOfWork: fake });
const sell = (buyer: ReturnType<typeof buyerOf>) => service.checkout(CALLER, checkoutOf([cokes(1)], { buyer, payments: [{ type: 'efectivo', amount: 2500 }] }));

describe('el cliente de la venta (US-37)', () => {
  beforeEach(() => loadMenu(fake));

  it('sin cliente elegido, crea uno nuevo con su log y lo vincula a la venta', async () => {
    const { saleId } = await sell(buyerOf('Rocío', { phone: '11 5555-1234', address: 'Mitre 123' }));
    const created = fake.customers.find((customer) => customer.name === 'Rocío');
    expect(created).toMatchObject({ phone: '11 5555-1234', address: 'Mitre 123', isActive: true });
    expect(fake.sales[0]).toMatchObject({ id: saleId, customerId: created?.id, buyerName: 'Rocío', buyerPhone: '11 5555-1234', buyerAddress: 'Mitre 123' });
    expect(fake.audits.map((entry) => entry.entity)).toEqual(['CUSTOMER', 'SALE']);
  });

  it('con un cliente elegido, lo vincula sin tocar Clientes y guarda los datos tal como se anotaron', async () => {
    await sell(buyerOf('Marta', { customerId: CLIENTE.id, phone: '351 400 1234', address: 'Belgrano 9' }));
    expect(fake.customers).toEqual([CLIENTE]);
    expect(fake.sales[0]).toMatchObject({ customerId: CLIENTE.id, buyerPhone: '351 400 1234', buyerAddress: 'Belgrano 9' });
    expect(fake.audits.map((entry) => entry.entity)).toEqual(['SALE']);
  });

  it('un cliente desactivado o borrado da NOT_FOUND "El cliente ya no existe." y no vende', async () => {
    fake.customers[0].isActive = false;
    for (const customerId of [CLIENTE.id, '20000000-0000-4000-8000-000000000099']) {
      const error = await sell(buyerOf('Marta', { customerId })).catch((caught: unknown) => caught);
      expect(isAppError(error) && [error.code, error.message]).toEqual(['NOT_FOUND', 'El cliente ya no existe.']);
    }
    expect(fake.sales).toEqual([]);
  });
});
