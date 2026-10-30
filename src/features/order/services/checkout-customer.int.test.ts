import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { customers, sales } from '@/lib/db/schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { checkoutService } from './checkout.service';

const CALLER = { id: TEST_USER_IDS.vendedor };
let coca: string;

const sell = (buyer: { customerId: string | null; name: string; phone: string; address: string }, quantity = 1) =>
  checkoutService.checkout(CALLER, { buyer, lines: [{ group: 'coca_cola', presentationKey: 'u1', flavors: [{ menuItemId: coca, units: 1 }], quantity }], discountPercentage: 0, discountAmount: 0, payments: [{ type: 'efectivo', amount: 2500 * quantity }] });

describe('el cliente de la venta contra Postgres (US-37 CA-1 y CA-4)', () => {
  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('vendedor');
    [{ id: coca }] = await db.insert(menuItems).values({ group: 'coca_cola', name: 'Coca 500', unitCost: '1200.00', stock: '2', price1: '2500.00' }).returning({ id: menuItems.id });
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('un cliente nuevo queda en Clientes con su domicilio y la venta guarda los datos anotados', async () => {
    const { saleId } = await sell({ customerId: null, name: 'Rocío', phone: '11 5555-1234', address: 'Mitre 123' });
    const [created] = await db.select().from(customers);
    expect(created).toMatchObject({ name: 'Rocío', phone: '11 5555-1234', address: 'Mitre 123', isActive: true });
    expect(await db.select().from(sales)).toMatchObject([{ id: saleId, customerId: created.id, buyerName: 'Rocío', buyerPhone: '11 5555-1234', buyerAddress: 'Mitre 123' }]);
  });

  it('un cliente elegido se vincula sin cambiar Clientes; si se desactiva, da NOT_FOUND', async () => {
    const [marta] = await db.insert(customers).values({ name: 'Marta', phone: '11 1111-1111' }).returning();
    await sell({ customerId: marta.id, name: 'Marta', phone: '11 2222-2222', address: 'Belgrano 9' });
    expect(await db.select().from(customers)).toMatchObject([{ id: marta.id, phone: '11 1111-1111', address: '' }]);
    expect(await db.select({ customerId: sales.customerId, buyerPhone: sales.buyerPhone }).from(sales)).toEqual([{ customerId: marta.id, buyerPhone: '11 2222-2222' }]);
    await db.update(customers).set({ isActive: false }).where(eq(customers.id, marta.id));
    await expect(sell({ customerId: marta.id, name: 'Marta', phone: '', address: '' })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'El cliente ya no existe.' });
  });

  it('si la venta falla, el cliente nuevo no queda guardado', async () => {
    await expect(sell({ customerId: null, name: 'Sin stock', phone: '', address: '' }, 3)).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
    expect([await db.select().from(customers), await db.select().from(sales)]).toEqual([[], []]);
  });
});
