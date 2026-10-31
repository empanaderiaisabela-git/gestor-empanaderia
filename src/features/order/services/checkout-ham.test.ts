import { beforeEach, describe, expect, it } from 'vitest';
import type { CheckoutLine } from '@/features/order/domain/checkout.schema';
import { createFakeCheckoutUnitOfWork } from '../testing/fake-checkout-unit-of-work';
import { CALLER, checkoutOf, COCA, halfAndHalf, loadMenu, MUZZA, PREPIZZA } from '../testing/checkout-fixtures';
import { createCheckoutService } from './checkout.service';

const fake = createFakeCheckoutUnitOfWork();
const service = createCheckoutService({ unitOfWork: fake });
const cash = (amount: number) => [{ type: 'efectivo' as const, amount }];
const muzza = (quantity: number, ham?: boolean): CheckoutLine => ({ group: 'pizzas', presentationKey: 'pizza_1', flavors: [{ menuItemId: MUZZA.id, units: 1 }], quantity, ham });
const PIZZA_Y_COCA = { name: 'Pizza + Coca', price: 10000, components: [{ group: 'pizzas' as const, presentationKey: 'pizza_1', quantity: 1 }, { group: 'coca_cola' as const, presentationKey: 'u1', quantity: 1 }] };

describe('cobro con jamón extra (US-47 CA-5)', () => {
  beforeEach(async () => {
    loadMenu(fake);
    const prepizza = fake.stock.state.items.find((item) => item.id === PREPIZZA.id);
    if (prepizza) prepizza.stock = '5.0';
    await fake.extras.read.saveHam({ price: 1500, version: 0 });
  });

  it('el servidor suma el jamón a cada pizza del renglón y lo anota en la línea, sin costo (P-3)', async () => {
    expect(await service.checkout(CALLER, checkoutOf([muzza(2, true), { ...halfAndHalf, ham: true }], { payments: cash(32500) }))).toMatchObject({ total: 32500 });
    expect(fake.sales[0].lines.map(({ unitPrice, subtotal, description }) => ({ unitPrice, subtotal, description }))).toEqual([
      { unitPrice: 10500, subtotal: 21000, description: 'Muzza + Jamón extra' },
      { unitPrice: 11500, subtotal: 11500, description: 'Muzza / Napolitana + Jamón extra' },
    ]);
    expect(fake.sales[0].lines[0].items).toEqual([{ menuItemId: MUZZA.id, units: 2, unitCost: 2000 }]);
  });

  it('el jamón de una pizza de promo suma al precio de la promo (D-2)', async () => {
    const { id } = await fake.promotions.read.insert(PIZZA_Y_COCA);
    const parts = [{ group: 'pizzas' as const, presentationKey: 'pizza_1', flavors: [{ menuItemId: MUZZA.id, units: 1 }], ham: true }, { group: 'coca_cola' as const, presentationKey: 'u1', flavors: [{ menuItemId: COCA.id, units: 1 }] }];
    await service.checkout(CALLER, checkoutOf([], { promos: [{ promotionId: id, quantity: 1, parts }], payments: cash(11500) }));
    expect(fake.sales[0].lines[0]).toMatchObject({ unitPrice: 11500, subtotal: 11500, description: 'Pizza + Coca: Muzza + Jamón extra · Coca 500' });
  });

  it('VALIDATION si el jamón va en algo que no es pizza; MISSING_PRICE si no hay precio cargado', async () => {
    const coca: CheckoutLine = { group: 'coca_cola', presentationKey: 'u1', flavors: [{ menuItemId: COCA.id, units: 1 }], quantity: 1, ham: true };
    await expect(service.checkout(CALLER, checkoutOf([coca], { payments: cash(4000) }))).rejects.toMatchObject({ code: 'VALIDATION' });
    fake.extras.reset();
    await expect(service.checkout(CALLER, checkoutOf([muzza(1, true)], { payments: cash(10500) }))).rejects.toMatchObject({ code: 'MISSING_PRICE', message: 'Falta el precio de venta.' });
    expect(fake.sales).toHaveLength(0);
  });
});
