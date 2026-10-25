import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { menuGroupPrices } from '@/lib/db/menu-schema';
import type { DbTransaction } from '@/lib/db/transaction';
import type { GroupPricedGroup } from '@/features/menu/domain/menu-groups';
import type { MenuPrices } from '@/features/menu/domain/menu-prices';
import { priceColumns } from './menu-item.repository';

export type MenuGroupPrice = typeof menuGroupPrices.$inferSelect;
export type GroupPriceChange = { group: GroupPricedGroup; prices: MenuPrices; version: number };

export type MenuGroupPriceRepository = {
  findAll(): Promise<MenuGroupPrice[]>;
  save(change: GroupPriceChange): Promise<MenuGroupPrice | null>;
};

type Executor = typeof db | DbTransaction;

function columnsOf(prices: MenuPrices): Omit<MenuGroupPrice, 'group' | 'version' | 'updatedAt'> {
  return { ...priceColumns(prices), price1: prices.price1.toFixed(2) };
}

export function drizzleMenuGroupPriceRepository(executor: Executor = db): MenuGroupPriceRepository {
  return {
    findAll: () => executor.select().from(menuGroupPrices).orderBy(asc(menuGroupPrices.group)),
    save: async ({ group, prices, version }) => {
      if (version === 0) {
        const inserted = await executor.insert(menuGroupPrices).values({ group, ...columnsOf(prices) }).onConflictDoNothing().returning();
        return inserted[0] ?? null;
      }
      const sameVersion = and(eq(menuGroupPrices.group, group), eq(menuGroupPrices.version, version));
      const updated = await executor.update(menuGroupPrices).set({ ...columnsOf(prices), version: version + 1, updatedAt: new Date() }).where(sameVersion).returning();
      return updated[0] ?? null;
    },
  };
}
