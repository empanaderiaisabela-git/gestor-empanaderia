import { afterAll } from 'vitest';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { providers } from '@/lib/db/schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedBases } from '@/test/seed-bases';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { describeStockRepository } from '../testing/stock-repository.behavior';
import { drizzleStockRepository } from './stock.repository';

afterAll(async () => {
  await db.$client.end();
});

describeStockRepository('Drizzle contra db-test', async () => {
  await truncateAll();
  await seedTestUser('admin');
  const [provider] = await db.insert(providers).values({ name: 'Molino del Sur' }).returning({ id: providers.id });
  const [item] = await db.insert(menuItems).values({ group: 'pizzas', name: 'Muzza', unitCost: '3000.00', stock: '2.5', price1: '11000.00' }).returning({ id: menuItems.id });
  const [sibling] = await db.insert(menuItems).values({ group: 'pizzas', name: 'Napolitana' }).returning({ id: menuItems.id });
  const { pizzas } = await seedBases();
  return { repository: drizzleStockRepository(db), itemId: item.id, siblingId: sibling.id, baseId: pizzas, userId: TEST_USER_IDS.admin, providerId: provider.id };
});
