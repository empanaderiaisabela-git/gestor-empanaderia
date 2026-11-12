import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { salePayments, sales } from '@/lib/db/schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { checkoutService } from './checkout.service';
import { salePaymentService } from './sale-payment.service';

const CALLER = { id: TEST_USER_IDS.vendedor };
const BUYER = { customerId: null, name: 'Marta', phone: '', address: '' };
const cash = (amount: number) => [{ type: 'efectivo' as const, amount }];

describe('venta pendiente y pago completado contra Postgres (US-68, US-69)', () => {
  let saleId: string;

  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('vendedor');
    const [{ id: carne }] = await db.insert(menuItems).values({ group: 'empanadas', name: 'Carne', unitCost: '400.00', stock: '12.0', price1: '1500.00', price3: '4200.00', price6: '8000.00', price12: '15000.00' }).returning({ id: menuItems.id });
    const lines = [{ group: 'empanadas' as const, presentationKey: 'u6', flavors: [{ menuItemId: carne, units: 6 }], quantity: 1 }];
    ({ saleId } = await checkoutService.checkout(CALLER, { checkoutKey: crypto.randomUUID(), buyer: BUYER, lines, discountPercentage: 0, discountAmount: 0, payments: [] }));
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('la venta sin medio queda sin pagos; al completarla guarda el descuento, el total y el pago', async () => {
    expect(await db.select().from(salePayments)).toEqual([]);
    await salePaymentService.complete(CALLER, { saleId, discountPercentage: 10, discountAmount: 0, payments: cash(7200) });
    expect(await db.select({ total: sales.total, discount: sales.discountPercentage }).from(sales)).toEqual([{ total: '7200.00', discount: '10.00' }]);
    expect(await db.select({ type: salePayments.type, amount: salePayments.amount }).from(salePayments)).toEqual([{ type: 'efectivo', amount: '7200.00' }]);
  });

  it('dos que completan a la vez: uno gana y el otro recibe STALE_VERSION', async () => {
    const input = { saleId, discountPercentage: 0, discountAmount: 0, payments: cash(8000) };
    const results = await Promise.allSettled([salePaymentService.complete(CALLER, input), salePaymentService.complete(CALLER, input)]);
    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({ reason: { code: 'STALE_VERSION' } });
    expect(await db.select().from(salePayments)).toHaveLength(1);
  });
});
