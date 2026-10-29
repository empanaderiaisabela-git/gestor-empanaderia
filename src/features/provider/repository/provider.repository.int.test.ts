import { afterAll } from 'vitest';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db/expense-schema';
import { menuItems } from '@/lib/db/menu-schema';
import { stockEntries } from '@/lib/db/stock-schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { describeProviderRepository } from '../testing/provider-repository.behavior';
import { drizzleProviderRepository } from './provider.repository';

afterAll(async () => {
  await db.$client.end();
});

describeProviderRepository('Drizzle contra db-test', async () => {
  await truncateAll();
  await seedTestUser('admin');
  return {
    repository: drizzleProviderRepository(db),
    linkStockEntry: async (providerId) => {
      const [item] = await db.insert(menuItems).values({ group: 'empanadas', name: `Carne ${providerId}`, unitCost: '400.00' }).returning({ id: menuItems.id });
      await db.insert(stockEntries).values({ menuItemId: item.id, quantity: 12, unitCost: '400.00', providerId, userId: TEST_USER_IDS.admin });
    },
    linkExpense: async (providerId) => {
      await db.insert(expenses).values({ invoiceNumber: providerId.slice(0, 30), title: 'Harina', amount: '100.00', invoiceDate: '2026-10-24', providerId, userId: TEST_USER_IDS.admin });
    },
  };
});
