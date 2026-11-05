import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { promotionComponents, promotions } from '@/lib/db/promotion-schema';
import { truncateAll } from '@/test/truncate-all';
import { clearMenu } from './seed-menu';

describe('clearMenu del seed', () => {
  beforeEach(truncateAll);
  afterAll(async () => {
    await db.$client.end();
  });

  it('regression BUG-31: vacía el menú aunque una promo tenga una bebida fija', async () => {
    const [coca] = await db.insert(menuItems).values({ group: 'coca_cola', name: 'Coca-Cola 1.5L' }).returning({ id: menuItems.id });
    const [promo] = await db.insert(promotions).values({ name: 'Docena + Coca', price: '15000.00' }).returning({ id: promotions.id });
    await db.insert(promotionComponents).values({ promotionId: promo.id, group: 'coca_cola', presentationKey: 'u1', quantity: 1, menuItemId: coca.id, position: 0 });
    await clearMenu();
    expect([await db.select().from(menuItems), await db.select().from(promotions), await db.select().from(promotionComponents)]).toEqual([[], [], []]);
  });
});
