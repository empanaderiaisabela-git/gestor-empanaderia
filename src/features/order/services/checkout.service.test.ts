import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeCheckoutUnitOfWork } from '../testing/fake-checkout-unit-of-work';
import { CALLER, CARNE, checkoutOf, COCA, cokes, halfAndHalf, halfDozen, loadMenu, MUZZA, NAPO, POLLO, stockOf } from '../testing/checkout-fixtures';
import { createCheckoutService } from './checkout.service';

const fake = createFakeCheckoutUnitOfWork();
const service = createCheckoutService({ unitOfWork: fake });
const cash = (amount: number) => [{ type: 'efectivo' as const, amount }];

describe('cobrar el pedido (US-6)', () => {
  beforeEach(() => loadMenu(fake));

  it('cobra una ½ docena surtida y una pizza mitad y mitad con dos medios de pago (CA-1, CA-3)', async () => {
    const payments = [{ type: 'efectivo' as const, amount: 10000 }, { type: 'debito' as const, amount: 8000 }];
    const result = await service.checkout(CALLER, checkoutOf([halfDozen, halfAndHalf], { buyerName: 'Marta', payments }));
    expect(result.total).toBe(18000);
    expect(fake.sales).toEqual([
      {
        id: result.saleId,
        createdAt: expect.any(Date),
        vendorId: CALLER.id,
        buyerName: 'Marta',
        total: 18000,
        discountAmount: 0,
        discountPercentage: 0,
        payments,
        lines: [
          { group: 'empanadas', presentationKey: 'u6', quantity: 1, unitPrice: 8000, subtotal: 8000, description: '2 Carne + 4 Pollo', position: 0, items: [{ menuItemId: CARNE.id, units: 2, unitCost: 400 }, { menuItemId: POLLO.id, units: 4, unitCost: 350 }] },
          { group: 'pizzas', presentationKey: 'pizza_2', quantity: 1, unitPrice: 10000, subtotal: 10000, description: 'Muzza / Napolitana', position: 1, items: [{ menuItemId: MUZZA.id, units: 0.5, unitCost: 2000 }, { menuItemId: NAPO.id, units: 0.5, unitCost: 1500 }] },
        ],
      },
    ]);
    expect(fake.audits).toEqual([{ userId: CALLER.id, action: 'CREAR', entity: 'SALE', entityId: result.saleId, detail: { total: 18000, buyerName: 'Marta', lines: 2, payments } }]);
  });

  it('descuenta el stock de cada gusto, también media pizza (CA-4)', async () => {
    await service.checkout(CALLER, checkoutOf([halfDozen, halfAndHalf], { payments: cash(18000) }));
    expect([CARNE, POLLO, MUZZA, NAPO].map((item) => stockOf(fake, item.id))).toEqual(['8.0', '6.0', '2.0', '1.5']);
  });

  it('una línea con cantidad 3 consume y cobra por 3', async () => {
    const result = await service.checkout(CALLER, checkoutOf([cokes(3)], { payments: cash(7500) }));
    expect(result.total).toBe(7500);
    expect(fake.sales[0].lines[0]).toMatchObject({ quantity: 3, unitPrice: 2500, subtotal: 7500, items: [{ menuItemId: COCA.id, units: 3 }] });
    expect(stockOf(fake, COCA.id)).toBe('2.0');
  });

  it('aplica primero el porcentaje y después el monto (CA-5)', async () => {
    const result = await service.checkout(CALLER, checkoutOf([cokes(2)], { discountPercentage: 10, discountAmount: 500, payments: cash(4000) }));
    expect(result.total).toBe(4000);
    expect(fake.sales[0]).toMatchObject({ total: 4000, discountPercentage: 10, discountAmount: 500 });
  });
});
