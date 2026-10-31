import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuItems, pizzaExtras } from '@/lib/db/menu-schema';
import { saleLineItems, saleLines } from '@/lib/db/order-schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedBases } from '@/test/seed-bases';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { checkoutService } from './checkout.service';

const CALLER = { id: TEST_USER_IDS.vendedor };
const BUYER = { customerId: null, name: 'Mostrador', phone: '', address: '' };

describe('cobro con jamón extra contra Postgres (US-47 CA-5)', () => {
  let muzza: string;

  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('vendedor');
    await seedBases(3);
    [{ id: muzza }] = await db.insert(menuItems).values({ group: 'pizzas', name: 'Muzza', unitCost: '2000.00', price1: '9000.00' }).returning({ id: menuItems.id });
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('guarda la línea con el jamón en el precio y en la descripción, y el costo sólo del gusto', async () => {
    await db.insert(pizzaExtras).values({ code: 'jamon', price: '1500.00' });
    const lines = [{ group: 'pizzas' as const, presentationKey: 'pizza_1', flavors: [{ menuItemId: muzza, units: 1 }], quantity: 2, ham: true }];
    expect(await checkoutService.checkout(CALLER, { buyer: BUYER, lines, discountPercentage: 0, discountAmount: 0, payments: [{ type: 'efectivo', amount: 21000 }] })).toMatchObject({ total: 21000 });
    expect(await db.select({ unitPrice: saleLines.unitPrice, subtotal: saleLines.subtotal, description: saleLines.description }).from(saleLines)).toEqual([{ unitPrice: '10500.00', subtotal: '21000.00', description: 'Muzza + Jamón extra' }]);
    expect(await db.select({ unitCost: saleLineItems.unitCost }).from(saleLineItems)).toEqual([{ unitCost: '2000.00' }]);
  });

  it('sin precio de jamón, MISSING_PRICE y no se guarda nada', async () => {
    const lines = [{ group: 'pizzas' as const, presentationKey: 'pizza_1', flavors: [{ menuItemId: muzza, units: 1 }], quantity: 1, ham: true }];
    await expect(checkoutService.checkout(CALLER, { buyer: BUYER, lines, discountPercentage: 0, discountAmount: 0, payments: [{ type: 'efectivo', amount: 10500 }] })).rejects.toMatchObject({ code: 'MISSING_PRICE' });
    expect(await db.select().from(saleLines)).toEqual([]);
  });
});
