import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { stockEntries } from '@/lib/db/stock-schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { stockService } from './stock.service';

const CALLER = { id: TEST_USER_IDS.admin };

async function stockOf(id: string): Promise<number> {
  const [row] = await db.select({ stock: menuItems.stock }).from(menuItems).where(eq(menuItems.id, id));
  return Number(row.stock);
}

describe('ingresos y mermas simultáneos sobre el mismo gusto (US-4 CA-2)', () => {
  let itemId: string;

  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('admin');
    const [item] = await db.insert(menuItems).values({ group: 'empanadas', name: 'Carne', unitCost: '400.00', stock: '10' }).returning({ id: menuItems.id });
    itemId = item.id;
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('ninguna operación pisa a otra: 5 ingresos de 2 y 2 mermas de 1 dejan 10 + 10 − 2', async () => {
    const entries = Array.from({ length: 5 }, () => stockService.registerEntry(CALLER, { menuItemId: itemId, quantity: 2 }));
    const losses = Array.from({ length: 2 }, () => stockService.registerLoss(CALLER, { menuItemId: itemId, quantity: 1, reason: 'Se cayó' }));
    await Promise.all([...entries, ...losses]);
    expect(await stockOf(itemId)).toBe(18);
    expect(await db.select().from(stockEntries)).toHaveLength(5);
  });

  it('si la merma no alcanza, no se registra nada', async () => {
    await expect(stockService.registerLoss(CALLER, { menuItemId: itemId, quantity: 11, reason: 'x' })).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
    expect(await stockOf(itemId)).toBe(10);
  });
});
