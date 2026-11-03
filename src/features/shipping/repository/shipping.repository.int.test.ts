import { afterAll } from 'vitest';
import { db } from '@/lib/db';
import { sales } from '@/lib/db/schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { describeShippingRepository } from '../testing/shipping-repository.behavior';
import { drizzleShippingRepository } from './shipping.repository';

afterAll(async () => {
  await db.$client.end();
});

describeShippingRepository('Drizzle contra db-test', async () => {
  await truncateAll();
  await seedTestUser('admin');
  return {
    repository: drizzleShippingRepository(db),
    linkSale: async (shippingId) => {
      await db.insert(sales).values({ vendorId: TEST_USER_IDS.admin, total: '1500.00', shippingOptionId: shippingId, shippingTitle: 'Centro', shippingAmount: '1500.00' });
    },
  };
});
