import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeCheckoutUnitOfWork } from '../testing/fake-checkout-unit-of-work';
import { CALLER, CARNE, checkoutOf, halfDozen, loadMenu, stockOf } from '../testing/checkout-fixtures';
import { createCheckoutService } from './checkout.service';

const fake = createFakeCheckoutUnitOfWork();
const service = createCheckoutService({ unitOfWork: fake });

describe('venta con el pago pendiente (US-68)', () => {
  beforeEach(() => {
    loadMenu(fake);
  });

  it('sin medio de pago registra la venta con su total, sin pagos, y descuenta el stock', async () => {
    expect(await service.checkout(CALLER, checkoutOf([halfDozen], { discountPercentage: 10 }))).toMatchObject({ total: 7200 });
    expect(fake.sales[0]).toMatchObject({ total: 7200, payments: [] });
    expect(stockOf(fake, CARNE.id)).toBe('8.0');
  });

  it('con medios de pago, siguen teniendo que cubrir el total', async () => {
    await expect(service.checkout(CALLER, checkoutOf([halfDozen], { payments: [{ type: 'efectivo', amount: 100 }] }))).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});
