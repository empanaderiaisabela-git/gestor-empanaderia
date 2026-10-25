import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuGroupPrices, menuItems } from '@/lib/db/menu-schema';
import { saleLineItems, saleLines } from '@/lib/db/order-schema';
import { auditLogs, salePayments, sales } from '@/lib/db/schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-legacy-catalog';
import { truncateAll } from '@/test/truncate-all';
import { checkoutService } from './checkout.service';

const CALLER = { id: TEST_USER_IDS.vendedor };
const cash = (amount: number) => [{ type: 'efectivo' as const, amount }];
const line = (menuItemId: string, quantity = 1) => ({ group: 'coca_cola' as const, presentationKey: 'u1', flavors: [{ menuItemId, units: 1 }], quantity });
const order = (lines: ReturnType<typeof line>[], paid: number) => ({ buyerName: null, lines, discountPercentage: 0, discountAmount: 0, payments: cash(paid) });

async function stockOf(id: string): Promise<number> {
  const [row] = await db.select({ stock: menuItems.stock }).from(menuItems).where(eq(menuItems.id, id));
  return Number(row.stock);
}

async function insertItem(values: typeof menuItems.$inferInsert): Promise<string> {
  const [row] = await db.insert(menuItems).values(values).returning({ id: menuItems.id });
  return row.id;
}

describe('cobro contra Postgres (US-6 CA-3 y CA-4)', () => {
  let coca: string;

  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('vendedor');
    coca = await insertItem({ group: 'coca_cola', name: 'Coca 500', unitCost: '1200.00', stock: '1', price1: '2500.00' });
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('guarda la venta, sus líneas con el costo congelado, los pagos y la auditoría', async () => {
    await db.insert(menuGroupPrices).values({ group: 'empanadas', price1: '1500', price3: '4200', price6: '8000', price12: '15000' });
    const carne = await insertItem({ group: 'empanadas', name: 'Carne', unitCost: '400.00', stock: '12' });
    const empanadas = { group: 'empanadas' as const, presentationKey: 'u3', flavors: [{ menuItemId: carne, units: 3 }], quantity: 2 };
    const { saleId, total } = await checkoutService.checkout(CALLER, { ...order([line(coca)], 10900), lines: [empanadas, line(coca)], buyerName: 'Marta' });
    expect(total).toBe(10900);
    expect(await db.select().from(sales)).toMatchObject([{ id: saleId, vendorId: CALLER.id, buyerName: 'Marta', total: '10900.00', customerId: null }]);
    expect(await db.select().from(saleLines)).toHaveLength(2);
    expect(await db.select({ units: saleLineItems.units, unitCost: saleLineItems.unitCost }).from(saleLineItems).where(eq(saleLineItems.menuItemId, carne))).toEqual([{ units: '6.0', unitCost: '400.00' }]);
    expect(await db.select({ type: salePayments.type, amount: salePayments.amount }).from(salePayments)).toEqual([{ type: 'efectivo', amount: '10900.00' }]);
    expect(await db.select({ entity: auditLogs.entity, entityId: auditLogs.entityId }).from(auditLogs)).toEqual([{ entity: 'SALE', entityId: saleId }]);
    expect([await stockOf(carne), await stockOf(coca)]).toEqual([6, 0]);
  });

  it('dos cobros simultáneos de la última Coca: uno gana y el otro recibe INSUFFICIENT_STOCK', async () => {
    const results = await Promise.allSettled([checkoutService.checkout(CALLER, order([line(coca)], 2500)), checkoutService.checkout(CALLER, order([line(coca)], 2500))]);
    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({ reason: { code: 'INSUFFICIENT_STOCK' } });
    expect(await stockOf(coca)).toBe(0);
    expect(await db.select().from(sales)).toHaveLength(1);
  });

  it('si un gusto no alcanza, el otro no se descuenta y no queda venta a medias', async () => {
    const pepsi = await insertItem({ group: 'pepsi', name: 'Pepsi 500', unitCost: '1000.00', stock: '5', price1: '2000.00' });
    const both = { ...order([line(coca, 2)], 7000), lines: [{ ...line(pepsi), group: 'pepsi' as const }, line(coca, 2)] };
    await expect(checkoutService.checkout(CALLER, both)).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
    expect([await stockOf(pepsi), await stockOf(coca)]).toEqual([5, 1]);
    expect(await db.select().from(sales)).toEqual([]);
  });
});
