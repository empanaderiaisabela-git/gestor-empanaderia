import { beforeEach, describe, expect, it } from 'vitest';
import type { CheckoutLine } from '@/features/order/domain/checkout.schema';
import { createFakeCheckoutUnitOfWork } from '../testing/fake-checkout-unit-of-work';
import { CALLER, checkoutOf, COCA, halfAndHalf, JYQ, loadMenu, MUZZA, NAPO, PAN, PREPIZZA, stockOf } from '../testing/checkout-fixtures';
import { createCheckoutService } from './checkout.service';

const fake = createFakeCheckoutUnitOfWork();
const service = createCheckoutService({ unitOfWork: fake });
const cash = (amount: number) => [{ type: 'efectivo' as const, amount }];
const muzzas = (quantity: number): CheckoutLine => ({ group: 'pizzas', presentationKey: 'pizza_1', flavors: [{ menuItemId: MUZZA.id, units: 1 }], quantity });
const ciabatta: CheckoutLine = { group: 'ciabattas', presentationKey: 'u1', flavors: [{ menuItemId: JYQ.id, units: 1 }], quantity: 1 };
const PIZZA_Y_COCA = { name: 'Pizza + Coca', price: 10000, components: [{ group: 'pizzas' as const, presentationKey: 'pizza_1', quantity: 1 }, { group: 'coca_cola' as const, presentationKey: 'u1', quantity: 1 }] };
const PROMO_PARTS = [
  { group: 'pizzas' as const, presentationKey: 'pizza_1', flavors: [{ menuItemId: MUZZA.id, units: 1 }] },
  { group: 'coca_cola' as const, presentationKey: 'u1', flavors: [{ menuItemId: COCA.id, units: 1 }] },
];

describe('cobro con prepizzas y panes de ciabatta (US-29 CA-3)', () => {
  beforeEach(() => {
    loadMenu(fake);
    const jyq = fake.stock.state.items.find((item) => item.id === JYQ.id);
    if (jyq) jyq.price1 = '6000.00';
  });

  it('una pizza de 1 sabor y una mitad y mitad descuentan 2 prepizzas; el costo sale de los gustos (D-1)', async () => {
    await service.checkout(CALLER, checkoutOf([muzzas(1), halfAndHalf], { payments: cash(19000) }));
    expect([PREPIZZA, MUZZA, NAPO].map((item) => stockOf(fake, item.id))).toEqual(['0.0', '0.0', '0.0']);
    expect(fake.sales[0].lines.map((line) => line.items)).toEqual([
      [{ menuItemId: MUZZA.id, units: 1, unitCost: 2000 }],
      [{ menuItemId: MUZZA.id, units: 0.5, unitCost: 2000 }, { menuItemId: NAPO.id, units: 0.5, unitCost: 1500 }],
    ]);
  });

  it('una ciabatta descuenta 1 pan y no toca el stock del gusto', async () => {
    await service.checkout(CALLER, checkoutOf([ciabatta], { payments: cash(6000) }));
    expect([stockOf(fake, PAN.id), stockOf(fake, JYQ.id)]).toEqual(['0.0', '0.0']);
  });

  it('INSUFFICIENT_STOCK con el nombre de la base, sin guardar nada', async () => {
    await expect(service.checkout(CALLER, checkoutOf([muzzas(3)], { payments: cash(27000) }))).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK', message: 'No hay stock suficiente de Prepizza.' });
    await expect(service.checkout(CALLER, checkoutOf([{ ...ciabatta, quantity: 2 }], { payments: cash(12000) }))).rejects.toMatchObject({ message: 'No hay stock suficiente de Pan de ciabatta.' });
    expect([stockOf(fake, PREPIZZA.id), fake.sales.length]).toEqual(['2.0', 0]);
  });

  it('una promo con pizza descuenta la prepizza como la venta suelta (D-11)', async () => {
    const { id } = await fake.promotions.read.insert(PIZZA_Y_COCA);
    await service.checkout(CALLER, checkoutOf([], { promos: [{ promotionId: id, quantity: 2, parts: PROMO_PARTS }], payments: cash(20000) }));
    expect([stockOf(fake, PREPIZZA.id), stockOf(fake, COCA.id)]).toEqual(['0.0', '3.0']);
    expect(fake.sales[0].lines[0].items).toEqual([{ menuItemId: MUZZA.id, units: 2, unitCost: 2000 }, { menuItemId: COCA.id, units: 2, unitCost: 1200 }]);
  });

  it('VALIDATION: la base no se vende sola, ni suelta ni en una promo (D-2)', async () => {
    const base: CheckoutLine = { ...muzzas(1), flavors: [{ menuItemId: PREPIZZA.id, units: 1 }] };
    await expect(service.checkout(CALLER, checkoutOf([base], { payments: cash(9000) }))).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('NOT_FOUND si falta la base del grupo', async () => {
    fake.stock.state.items.splice(fake.stock.state.items.findIndex((item) => item.id === PREPIZZA.id), 1);
    await expect(service.checkout(CALLER, checkoutOf([muzzas(1)], { payments: cash(9000) }))).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
