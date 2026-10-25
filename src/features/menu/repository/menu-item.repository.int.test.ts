import { afterAll } from 'vitest';
import { db } from '@/lib/db';
import { stockEntries } from '@/lib/db/stock-schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-legacy-catalog';
import { truncateAll } from '@/test/truncate-all';
import { describeMenuItemRepository } from '../testing/menu-item-repository.behavior';
import { drizzleMenuItemRepository } from './menu-item.repository';

afterAll(async () => {
  await db.$client.end();
});

describeMenuItemRepository(
  'Drizzle contra db-test',
  async () => {
    await truncateAll();
    await seedTestUser('admin');
    return {
      repository: drizzleMenuItemRepository(db),
      linkMovement: async (menuItemId) => {
        await db.insert(stockEntries).values({ menuItemId, quantity: 1, unitCost: '1.00', userId: TEST_USER_IDS.admin });
      },
    };
  },
  { withMovements: true }
);
