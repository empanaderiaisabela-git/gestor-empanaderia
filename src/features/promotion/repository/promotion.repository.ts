import { and, asc, desc, eq, ilike, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { promotionComponents, promotions } from '@/lib/db/promotion-schema';
import type { DbTransaction } from '@/lib/db/transaction';
import type { PromotionComponent, PromotionInput } from '@/features/promotion/domain/promotion.schema';

type PromotionRow = typeof promotions.$inferSelect;
export type StoredComponent = PromotionComponent & { menuItemName: string | null };
export type Promotion = PromotionRow & { components: StoredComponent[] };
export type PromotionChanges = Partial<{ name: string; price: number; components: PromotionComponent[]; isActive: boolean }>;
export type VersionedRef = { id: string; version: number };

export type PromotionRepository = {
  findAll(): Promise<Promotion[]>;
  findById(id: string): Promise<Promotion | null>;
  findByName(name: string): Promise<{ id: string } | null>;
  insert(input: PromotionInput): Promise<Promotion>;
  update(ref: VersionedRef, changes: PromotionChanges): Promise<Promotion | null>;
  remove(ref: VersionedRef): Promise<boolean>;
};

type Executor = typeof db | DbTransaction;

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`);
const sameVersion = ({ id, version }: VersionedRef) => and(eq(promotions.id, id), eq(promotions.version, version));
const { group, presentationKey, quantity, menuItemId, promotionId } = promotionComponents;
const COMPONENT_COLUMNS = { promotionId, group, presentationKey, quantity, menuItemId, menuItemName: menuItems.name };

async function withComponents(executor: Executor, rows: PromotionRow[]): Promise<Promotion[]> {
  const ids = rows.map((row) => row.id);
  const parts =
    ids.length === 0
      ? []
      : await executor.select(COMPONENT_COLUMNS).from(promotionComponents).leftJoin(menuItems, eq(menuItems.id, menuItemId)).where(inArray(promotionId, ids)).orderBy(asc(promotionComponents.position));
  const componentsOf = (id: string): StoredComponent[] => parts.filter((part) => part.promotionId === id).map(({ promotionId: _, ...component }) => component);
  return rows.map((row) => ({ ...row, components: componentsOf(row.id) }));
}

async function writeComponents(executor: Executor, promotionId: string, components: PromotionComponent[]): Promise<void> {
  await executor.delete(promotionComponents).where(eq(promotionComponents.promotionId, promotionId));
  await executor.insert(promotionComponents).values(components.map((component, position) => ({ ...component, promotionId, position })));
}

function changeColumns({ price, ...rest }: Omit<PromotionChanges, 'components'>): Partial<PromotionRow> {
  return { ...rest, ...(price === undefined ? {} : { price: price.toFixed(2) }) };
}

export function drizzlePromotionRepository(executor: Executor = db): PromotionRepository {
  return {
    findAll: async () => withComponents(executor, await executor.select().from(promotions).orderBy(desc(promotions.createdAt))),
    findById: async (id) => (await withComponents(executor, await executor.select().from(promotions).where(eq(promotions.id, id))))[0] ?? null,
    findByName: async (name) => (await executor.select({ id: promotions.id }).from(promotions).where(ilike(promotions.name, escapeLike(name))).limit(1))[0] ?? null,
    insert: async ({ name, price, components }) => {
      const [row] = await executor.insert(promotions).values({ name, price: price.toFixed(2) }).returning();
      await writeComponents(executor, row.id, components);
      return (await withComponents(executor, [row]))[0];
    },
    update: async (ref, { components, ...changes }) => {
      const [row] = await executor.update(promotions).set({ ...changeColumns(changes), version: ref.version + 1, updatedAt: new Date() }).where(sameVersion(ref)).returning();
      if (!row) return null;
      if (components) await writeComponents(executor, row.id, components);
      return (await withComponents(executor, [row]))[0];
    },
    remove: async (ref) => (await executor.delete(promotions).where(sameVersion(ref)).returning({ id: promotions.id })).length > 0,
  };
}
