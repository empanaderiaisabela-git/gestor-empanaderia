import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeCheckoutUnitOfWork } from '../testing/fake-checkout-unit-of-work';
import { buyerOf, CALLER, checkoutOf, halfDozen, loadMenu } from '../testing/checkout-fixtures';
import { createCheckoutService } from './checkout.service';

const fake = createFakeCheckoutUnitOfWork();
const service = createCheckoutService({ unitOfWork: fake });
const cash = (amount: number) => [{ type: 'efectivo' as const, amount }];
const withAddress = buyerOf('Marta', { address: 'San Martín 123' });

async function centro(amount = 1500): Promise<string> {
  return (await fake.shippings.read.insert({ title: 'Centro', detail: 'Barrio A hasta Barrio B', amount })).id;
}

describe('cobro con envío (US-59 CA-3)', () => {
  beforeEach(() => {
    loadMenu(fake);
  });

  it('suma el envío al total y guarda en la venta el envío, su título y su monto', async () => {
    const id = await centro();
    expect(await service.checkout(CALLER, checkoutOf([halfDozen], { buyer: withAddress, shippingOptionId: id, payments: cash(9500) }))).toMatchObject({ total: 9500 });
    expect(fake.sales[0]).toMatchObject({ total: 9500, shippingOptionId: id, shippingTitle: 'Centro', shippingAmount: 1500 });
    expect(fake.audits.at(-1)?.detail).toMatchObject({ total: 9500, shipping: 'Centro' });
  });

  it('el descuento se aplica sólo a la comida (D-2): $8.000 − 10 % + $1.500 = $8.700', async () => {
    const id = await centro();
    const input = checkoutOf([halfDozen], { buyer: withAddress, shippingOptionId: id, discountPercentage: 10, payments: cash(8700) });
    expect(await service.checkout(CALLER, input)).toMatchObject({ total: 8700 });
  });

  it('cobra el monto de la base aunque el carrito tenga otro, y un envío de $0 no suma', async () => {
    const id = await centro(0);
    await expect(service.checkout(CALLER, checkoutOf([halfDozen], { buyer: withAddress, shippingOptionId: id, payments: cash(9500) }))).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(await service.checkout(CALLER, checkoutOf([halfDozen], { buyer: withAddress, shippingOptionId: id, payments: cash(8000) }))).toMatchObject({ total: 8000 });
    expect(fake.sales[0]).toMatchObject({ shippingTitle: 'Centro', shippingAmount: 0 });
  });

  it('sin envío, la venta queda sin envío y en $0', async () => {
    await service.checkout(CALLER, checkoutOf([halfDozen], { payments: cash(8000) }));
    expect(fake.sales[0]).toMatchObject({ shippingOptionId: null, shippingTitle: null, shippingAmount: 0 });
    expect(fake.audits.at(-1)?.detail).not.toHaveProperty('shipping');
  });

  it('NOT_FOUND con un envío desactivado o que no existe, sin registrar la venta', async () => {
    const id = await centro();
    await fake.shippings.read.update({ id, version: 1 }, { isActive: false });
    const input = (shippingOptionId: string) => checkoutOf([halfDozen], { buyer: withAddress, shippingOptionId, payments: cash(9500) });
    await expect(service.checkout(CALLER, input(id))).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'El envío ya no existe.' });
    await expect(service.checkout(CALLER, input(crypto.randomUUID()))).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(fake.sales).toHaveLength(0);
  });

  it('VALIDATION si el descuento supera la comida aunque el envío cubra la diferencia', async () => {
    const id = await centro();
    const input = checkoutOf([halfDozen], { buyer: withAddress, shippingOptionId: id, discountAmount: 9000, payments: cash(500) });
    await expect(service.checkout(CALLER, input)).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});
