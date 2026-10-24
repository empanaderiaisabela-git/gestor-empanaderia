import { afterAll } from 'vitest';
import { db } from '@/lib/db';
import { devices, products } from '@/lib/db/schema';
import { truncateAll } from '@/test/truncate-all';
import { describeProviderRepository } from '../testing/provider-repository.behavior';
import { drizzleProviderRepository } from './provider.repository';

afterAll(async () => {
  await db.$client.end();
});

describeProviderRepository('Drizzle contra db-test', async () => {
  await truncateAll();
  return {
    repository: drizzleProviderRepository(db),
    linkProduct: async (providerId) => {
      const [device] = await db.insert(devices).values({ name: `Categoría ${providerId}` }).returning({ id: devices.id });
      await db.insert(products).values({ deviceId: device.id, providerId, purchasePrice: '1.00', salePrice: '2.00' });
    },
  };
});
