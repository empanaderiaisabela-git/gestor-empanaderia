import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { customers, sales } from '@/lib/db/schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import type { CheckoutData } from '@/features/order/domain/checkout.schema';
import { checkoutService } from './checkout.service';

const CALLER = { id: TEST_USER_IDS.vendedor };

async function saved(coca: string): Promise<{ sales: number; customers: number; stock: number }> {
  const [item] = await db.select({ stock: menuItems.stock }).from(menuItems).where(eq(menuItems.id, coca));
  return { sales: (await db.select().from(sales)).length, customers: (await db.select().from(customers)).length, stock: Number(item.stock) };
}

describe('el mismo cobro dos veces contra Postgres (BUG-33)', () => {
  let coca: string;
  let order: CheckoutData;

  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('vendedor');
    const [row] = await db.insert(menuItems).values({ group: 'coca_cola', name: 'Coca 500', unitCost: '1200.00', stock: '5', price1: '2500.00' }).returning({ id: menuItems.id });
    coca = row.id;
    const lines = [{ group: 'coca_cola' as const, presentationKey: 'u1', flavors: [{ menuItemId: coca, units: 1 }], quantity: 1 }];
    order = { checkoutKey: crypto.randomUUID(), buyer: { customerId: null, name: 'Jessica', phone: '', address: '' }, lines, discountPercentage: 0, discountAmount: 0, payments: [] };
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('regression BUG-33: reintentar después de guardar devuelve la misma venta', async () => {
    const first = await checkoutService.checkout(CALLER, order);
    expect(await checkoutService.checkout(CALLER, order)).toEqual(first);
    expect(await saved(coca)).toEqual({ sales: 1, customers: 1, stock: 4 });
  });

  it('dos cobros simultáneos con la misma clave dejan una sola venta (CA-2)', async () => {
    const [first, second] = await Promise.all([checkoutService.checkout(CALLER, order), checkoutService.checkout(CALLER, order)]);
    expect(second).toEqual(first);
    expect(await saved(coca)).toEqual({ sales: 1, customers: 1, stock: 4 });
  });

  it('la base no acepta dos ventas con la misma clave', async () => {
    const vendorId = CALLER.id;
    const sale = { vendorId, total: '1.00', checkoutKey: order.checkoutKey };
    await db.insert(sales).values(sale);
    await expect(db.insert(sales).values(sale)).rejects.toMatchObject({ cause: { code: '23505' } });
  });
});
