import { afterAll } from 'vitest';
import { db } from '@/lib/db';
import { truncateAll } from '@/test/truncate-all';
import { describeMenuGroupPriceRepository } from '../testing/menu-group-price-repository.behavior';
import { drizzleMenuGroupPriceRepository } from './menu-group-price.repository';

afterAll(async () => {
  await db.$client.end();
});

describeMenuGroupPriceRepository('Drizzle contra db-test', async () => {
  await truncateAll();
  return drizzleMenuGroupPriceRepository(db);
});
