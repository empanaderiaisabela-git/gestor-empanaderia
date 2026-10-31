import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { auditLogs } from '@/lib/db/schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { stockService } from './stock.service';

describe('registrar aumento contra Postgres (US-50 CA-2)', () => {
  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('admin');
  });
  afterAll(async () => {
    await db.$client.end();
  });

  it('sube costo y precios en una transacción, con versión y Auditoría', async () => {
    const [carne] = await db.insert(menuItems).values({ group: 'empanadas', name: 'Carne', unitCost: '1000.00', price1: '2750.00', price3: '7500.00', price6: '14000.00', price12: '26000.00' }).returning({ id: menuItems.id });
    await stockService.applyIncrease({ id: TEST_USER_IDS.admin }, { menuItemIds: [carne.id], costPercent: 10, pricePercent: 10 });
    const [row] = await db.select().from(menuItems).where(eq(menuItems.id, carne.id));
    expect(row).toMatchObject({ unitCost: '1100.00', price1: '3025.00', price12: '28600.00', version: 2 });
    expect(await db.select({ entity: auditLogs.entity }).from(auditLogs)).toEqual([{ entity: 'MENU_ITEM' }]);
  });
});
