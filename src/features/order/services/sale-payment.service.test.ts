import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeCheckoutUnitOfWork } from '../testing/fake-checkout-unit-of-work';
import { CALLER, checkoutOf, halfDozen, loadMenu } from '../testing/checkout-fixtures';
import { createFakeSalePaymentUnitOfWork } from '../testing/fake-sale-payment';
import { createCheckoutService } from './checkout.service';
import { createSalePaymentService } from './sale-payment.service';

const fake = createFakeCheckoutUnitOfWork();
const checkout = createCheckoutService({ unitOfWork: fake });
const service = createSalePaymentService({ unitOfWork: createFakeSalePaymentUnitOfWork(fake) });
const cash = (amount: number) => [{ type: 'efectivo' as const, amount }];

async function pendingSale(): Promise<string> {
  return (await checkout.checkout(CALLER, checkoutOf([halfDozen]))).saleId;
}

describe('completar el pago de una venta pendiente (US-69 CA-2)', () => {
  beforeEach(() => {
    loadMenu(fake);
  });

  it('con el descuento nuevo recalcula el total, guarda los pagos y lo audita (D-3)', async () => {
    const saleId = await pendingSale();
    expect(await service.complete(CALLER, { saleId, discountPercentage: 10, discountAmount: 0, payments: cash(7200) })).toEqual({ saleId, total: 7200 });
    expect(fake.sales[0]).toMatchObject({ total: 7200, discountPercentage: 10, payments: [{ type: 'efectivo', amount: 7200 }] });
    expect(fake.audits.at(-1)).toMatchObject({ action: 'ACTUALIZAR', entity: 'SALE', entityId: saleId, detail: { total: 7200, note: 'Pago completado' } });
  });

  it('STALE_VERSION si la venta ya tiene pagos (otro la completó)', async () => {
    const saleId = await pendingSale();
    await service.complete(CALLER, { saleId, discountPercentage: 0, discountAmount: 0, payments: cash(8000) });
    await expect(service.complete(CALLER, { saleId, discountPercentage: 0, discountAmount: 0, payments: cash(8000) })).rejects.toMatchObject({ code: 'STALE_VERSION' });
  });

  it('NOT_FOUND con una venta que no existe', async () => {
    await expect(service.complete(CALLER, { saleId: crypto.randomUUID(), discountPercentage: 0, discountAmount: 0, payments: cash(1) })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('VALIDATION si los pagos no cubren o el descuento se come la comida, sin guardar nada', async () => {
    const saleId = await pendingSale();
    await expect(service.complete(CALLER, { saleId, discountPercentage: 0, discountAmount: 0, payments: cash(100) })).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(service.complete(CALLER, { saleId, discountPercentage: 0, discountAmount: 9000, payments: cash(1) })).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(fake.sales[0].payments).toEqual([]);
  });
});
