import { and, asc, desc, eq, ilike } from 'drizzle-orm';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import type { DbTransaction } from '@/lib/db/transaction';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import type { MenuPrices } from '@/features/menu/domain/menu-prices';

export type MenuItem = typeof menuItems.$inferSelect;
export type MenuItemData = { group: MenuGroup; name: string; unitCost?: number; prices?: MenuPrices };
export type MenuItemChanges = Partial<{ name: string; unitCost: number; prices: MenuPrices; isActive: boolean; isVisible: boolean }>;
export type VersionedRef = { id: string; version: number };

export type MenuItemRepository = {
  findAll(): Promise<MenuItem[]>;
  findById(id: string): Promise<MenuItem | null>;
  findByName(group: MenuGroup, name: string): Promise<MenuItem | null>;
  insert(data: MenuItemData): Promise<MenuItem>;
  update(ref: VersionedRef, changes: MenuItemChanges): Promise<MenuItem | null>;
  remove(ref: VersionedRef): Promise<boolean>;
};

type Executor = typeof db | DbTransaction;

const money = (value: number | undefined): string | null => (value === undefined ? null : value.toFixed(2));
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`);
const sameVersion = ({ id, version }: VersionedRef) => and(eq(menuItems.id, id), eq(menuItems.version, version));

export function priceColumns(prices: MenuPrices | undefined): Pick<MenuItem, 'price1' | 'price3' | 'price6' | 'price12'> {
  return { price1: money(prices?.price1), price3: money(prices?.price3), price6: money(prices?.price6), price12: money(prices?.price12) };
}

function changeColumns({ prices, unitCost, ...rest }: MenuItemChanges): Partial<MenuItem> {
  return { ...rest, ...(prices ? priceColumns(prices) : {}), ...(unitCost === undefined ? {} : { unitCost: unitCost.toFixed(2) }) };
}

export function drizzleMenuItemRepository(executor: Executor = db): MenuItemRepository {
  return {
    findAll: () => executor.select().from(menuItems).orderBy(asc(menuItems.group), desc(menuItems.isBase), asc(menuItems.name)),
    findById: async (id) => (await executor.select().from(menuItems).where(eq(menuItems.id, id)))[0] ?? null,
    findByName: async (group, name) => {
      const rows = await executor.select().from(menuItems).where(and(eq(menuItems.group, group), ilike(menuItems.name, escapeLike(name)))).limit(1);
      return rows[0] ?? null;
    },
    insert: async ({ group, name, unitCost, prices }) => {
      const values = { group, name, unitCost: unitCost === undefined ? null : unitCost.toFixed(2), ...priceColumns(prices) };
      return (await executor.insert(menuItems).values(values).returning())[0];
    },
    update: async (ref, changes) => {
      const rows = await executor.update(menuItems).set({ ...changeColumns(changes), version: ref.version + 1, updatedAt: new Date() }).where(sameVersion(ref)).returning();
      return rows[0] ?? null;
    },
    remove: async (ref) => (await executor.delete(menuItems).where(sameVersion(ref)).returning({ id: menuItems.id })).length > 0,
  };
}
