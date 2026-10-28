import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeCheckoutUnitOfWork } from '../testing/fake-checkout-unit-of-work';
import { createFakeSaleHistoryUnitOfWork } from '../testing/fake-sale-history';
import { CALLER, checkoutOf, halfAndHalf, JYQ, loadMenu, MUZZA, NAPO, PAN, PREPIZZA, stockOf } from '../testing/checkout-fixtures';
import { createCheckoutService } from './checkout.service';
import { createSaleHistoryService } from './sale-history.service';

const fake = createFakeCheckoutUnitOfWork();
const checkout = createCheckoutService({ unitOfWork: fake });
const history = createSaleHistoryService({ unitOfWork: createFakeSaleHistoryUnitOfWork(fake) });
const muzza = { group: 'pizzas' as const, presentationKey: 'pizza_1', flavors: [{ menuItemId: MUZZA.id, units: 1 }], quantity: 1 };

function legacySale(): string {
  const id = crypto.randomUUID();
  const line = { group: 'pizzas' as const, presentationKey: 'pizza_2', promotionId: null, quantity: 1, unitPrice: 10000, subtotal: 10000, description: 'Muzza / Napolitana', position: 0 };
  const items = [{ menuItemId: MUZZA.id, units: 0.5, unitCost: 2000 }, { menuItemId: NAPO.id, units: 0.5, unitCost: 1500 }, { menuItemId: JYQ.id, units: 1, unitCost: 900 }];
  fake.sales.push({ id, createdAt: new Date(0), vendorId: CALLER.id, buyerName: null, total: 10000, discountAmount: 0, discountPercentage: 0, payments: [], lines: [{ ...line, items }] });
  return id;
}

describe('anular una venta devuelve las bases (US-29 CA-4, D-8)', () => {
  beforeEach(() => loadMenu(fake));

  it('una pizza de 1 sabor y una mitad y mitad devuelven 2 prepizzas', async () => {
    const { saleId } = await checkout.checkout(CALLER, checkoutOf([muzza, halfAndHalf], { payments: [{ type: 'efectivo', amount: 19000 }] }));
    expect(stockOf(fake, PREPIZZA.id)).toBe('0.0');
    await history.voidSale(CALLER, saleId);
    expect([PREPIZZA, MUZZA, NAPO].map((item) => stockOf(fake, item.id))).toEqual(['2.0', '0.0', '0.0']);
  });

  it('una venta cobrada antes del cambio suma ½ + ½ = 1 prepizza, y su ciabatta, 1 pan', async () => {
    await history.voidSale(CALLER, legacySale());
    expect([PREPIZZA, PAN, MUZZA, NAPO, JYQ].map((item) => stockOf(fake, item.id))).toEqual(['3.0', '2.0', '0.0', '0.0', '0.0']);
  });

  it('NOT_FOUND si falta la base, sin borrar la venta', async () => {
    const saleId = legacySale();
    fake.stock.state.items.splice(fake.stock.state.items.findIndex((item) => item.id === PAN.id), 1);
    await expect(history.voidSale(CALLER, saleId)).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'El producto ya no existe.' });
    expect(fake.sales).toHaveLength(1);
  });
});
