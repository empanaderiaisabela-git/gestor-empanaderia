import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeCheckoutUnitOfWork } from '../testing/fake-checkout-unit-of-work';
import { buyerOf, CALLER, checkoutOf, COCA, cokes, loadMenu, stockOf } from '../testing/checkout-fixtures';
import { createCheckoutService } from './checkout.service';

const fake = createFakeCheckoutUnitOfWork();
const service = createCheckoutService({ unitOfWork: fake });
const order = checkoutOf([cokes(2)], { buyer: buyerOf('Jessica'), payments: [{ type: 'transferencia', amount: 5000 }] });

describe('el mismo cobro dos veces (BUG-33)', () => {
  beforeEach(() => loadMenu(fake));

  it('regression BUG-33: la misma clave deja una venta, un cliente y el stock descontado una vez', async () => {
    const first = await service.checkout(CALLER, order);
    expect(await service.checkout(CALLER, order)).toEqual(first);
    expect(fake.sales.map((sale) => sale.checkoutKey)).toEqual([order.checkoutKey]);
    expect(fake.customers.filter((customer) => customer.name === 'Jessica')).toHaveLength(1);
    expect(fake.audits.filter((audit) => audit.entity === 'SALE')).toHaveLength(1);
    expect(stockOf(fake, COCA.id)).toBe('3.0');
  });

  it('otra clave es otra venta', async () => {
    await service.checkout(CALLER, order);
    await service.checkout(CALLER, { ...order, checkoutKey: crypto.randomUUID() });
    expect(fake.sales).toHaveLength(2);
    expect(stockOf(fake, COCA.id)).toBe('1.0');
  });
});
