import { afterAll } from 'vitest';
import { db } from '@/lib/db';
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
    return { repository: drizzleMenuItemRepository(db) };
  },
  { withMovements: false }
);
