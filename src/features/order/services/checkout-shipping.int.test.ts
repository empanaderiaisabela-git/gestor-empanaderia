import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { sales } from '@/lib/db/schema';
import { shippingOptions } from '@/lib/db/shipping-schema';
import { drizzleShippingRepository } from '@/features/shipping/repository/shipping.repository';
import { databaseErrorCode } from '@/lib/db-errors';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { checkoutService } from './checkout.service';

const CALLER = { id: TEST_USER_IDS.vendedor };
const BUYER = { customerId: null, name: 'Marta', phone: '', address: 'Mitre 123' };

describe('cobro con envío contra Postgres (US-59 CA-3)', () => {
  let carne: string;
  let centro: string;

  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('vendedor');
    [{ id: carne }] = await db.insert(menuItems).values({ group: 'empanadas', name: 'Carne', unitCost: '400.00', stock: '12.0', price1: '1500.00', price3: '4200.00', price6: '8000.00', price12: '15000.00' }).returning({ id: menuItems.id });
    [{ id: centro }] = await db.insert(shippingOptions).values({ title: 'Centro', amount: '1500.00' }).returning({ id: shippingOptions.id });
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('guarda el envío, su título y su monto en la venta, y el envío ya no se puede borrar', async () => {
    const lines = [{ group: 'empanadas' as const, presentationKey: 'u12', flavors: [{ menuItemId: carne, units: 12 }], quantity: 1 }];
    const input = { checkoutKey: crypto.randomUUID(), buyer: BUYER, lines, discountPercentage: 10, discountAmount: 0, payments: [{ type: 'efectivo' as const, amount: 15000 }], shippingOptionId: centro };
    expect(await checkoutService.checkout(CALLER, input)).toMatchObject({ total: 15000 });
    expect(await db.select({ total: sales.total, id: sales.shippingOptionId, title: sales.shippingTitle, amount: sales.shippingAmount }).from(sales)).toEqual([{ total: '15000.00', id: centro, title: 'Centro', amount: '1500.00' }]);
    const failure = await drizzleShippingRepository(db).remove({ id: centro, version: 1 }).then(() => null, databaseErrorCode);
    expect(failure).toBe('HAS_RELATIONS');
  });
});
