import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { providers, users } from '@/lib/db/schema';
import { stockEntries, stockLosses } from '@/lib/db/stock-schema';
import type { DbTransaction } from '@/lib/db/transaction';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import type { MenuPrices } from '@/features/menu/domain/menu-prices';
import { priceColumns } from '@/features/menu/repository/menu-item.repository';

export type StockItem = typeof menuItems.$inferSelect;
export type StockEntry = typeof stockEntries.$inferSelect;
export type StockLoss = typeof stockLosses.$inferSelect;
export type NewEntry = { menuItemId: string; quantity: number; unitCost: number; providerId: string | null; userId: string };
export type NewLoss = { menuItemId: string; quantity: number; unitCost: number; reason: string; userId: string };
export type EntryView = { id: string; menuItemId: string; quantity: number; unitCost: string; providerName: string | null; username: string; createdAt: Date };
export type ItemRef = { id: string; version: number };
export type StockChange = { stock?: number; unitCost?: number; prices?: MenuPrices };

export type StockRepository = {
  lockItem(id: string): Promise<StockItem | null>;
  lockGroup(group: MenuGroup): Promise<StockItem[]>;
  lockBase(group: MenuGroup): Promise<StockItem | null>;
  saveItem(ref: ItemRef, change: StockChange): Promise<StockItem | null>;
  insertEntry(entry: NewEntry): Promise<StockEntry>;
  insertLoss(loss: NewLoss): Promise<StockLoss>;
  entriesOf(menuItemId: string): Promise<EntryView[]>;
};

type Executor = typeof db | DbTransaction;

const HISTORY_LIMIT = 50;

export function drizzleStockRepository(executor: Executor = db): StockRepository {
  return {
    lockItem: async (id) => (await executor.select().from(menuItems).where(eq(menuItems.id, id)).for('update'))[0] ?? null,
    lockGroup: (group) => executor.select().from(menuItems).where(and(eq(menuItems.group, group), eq(menuItems.isBase, false))).orderBy(asc(menuItems.id)).for('update'),
    lockBase: async (group) => (await executor.select().from(menuItems).where(and(eq(menuItems.group, group), eq(menuItems.isBase, true))).for('update'))[0] ?? null,
    saveItem: async ({ id, version }, { stock, unitCost, prices }) => {
      const cost = unitCost === undefined ? {} : { unitCost: unitCost.toFixed(2) };
      const amount = stock === undefined ? {} : { stock: stock.toFixed(1) };
      const rows = await executor
        .update(menuItems)
        .set({ ...amount, ...cost, ...(prices ? priceColumns(prices) : {}), version: version + 1, updatedAt: new Date() })
        .where(and(eq(menuItems.id, id), eq(menuItems.version, version)))
        .returning();
      return rows[0] ?? null;
    },
    insertEntry: async ({ unitCost, ...entry }) => (await executor.insert(stockEntries).values({ ...entry, unitCost: unitCost.toFixed(2) }).returning())[0],
    insertLoss: async ({ unitCost, quantity, ...loss }) => (await executor.insert(stockLosses).values({ ...loss, quantity: quantity.toFixed(1), unitCost: unitCost.toFixed(2) }).returning())[0],
    entriesOf: (menuItemId) =>
      executor
        .select({ id: stockEntries.id, menuItemId: stockEntries.menuItemId, quantity: stockEntries.quantity, unitCost: stockEntries.unitCost, providerName: providers.name, username: users.username, createdAt: stockEntries.createdAt })
        .from(stockEntries)
        .leftJoin(providers, eq(stockEntries.providerId, providers.id))
        .innerJoin(users, eq(stockEntries.userId, users.id))
        .where(eq(stockEntries.menuItemId, menuItemId))
        .orderBy(desc(stockEntries.createdAt))
        .limit(HISTORY_LIMIT),
  };
}
