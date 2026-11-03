import { and, desc, eq, ilike } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sales } from '@/lib/db/schema';
import { shippingOptions } from '@/lib/db/shipping-schema';
import type { DbTransaction } from '@/lib/db/transaction';
import type { ShippingInput } from '@/features/shipping/domain/shipping.schema';

export type Shipping = typeof shippingOptions.$inferSelect;
export type ShippingChanges = Partial<ShippingInput & { isActive: boolean }>;
export type VersionedRef = { id: string; version: number };

export type ShippingRepository = {
  findAll(): Promise<Shipping[]>;
  findById(id: string): Promise<Shipping | null>;
  findByTitle(title: string): Promise<Shipping | null>;
  insert(input: ShippingInput): Promise<Shipping>;
  update(ref: VersionedRef, changes: ShippingChanges): Promise<Shipping | null>;
  remove(ref: VersionedRef): Promise<boolean>;
  hasSales(id: string): Promise<boolean>;
};

type Executor = typeof db | DbTransaction;

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`);
const sameVersion = ({ id, version }: VersionedRef) => and(eq(shippingOptions.id, id), eq(shippingOptions.version, version));

function columnsOf({ amount, ...rest }: ShippingChanges): Partial<Shipping> {
  return { ...rest, ...(amount === undefined ? {} : { amount: amount.toFixed(2) }) };
}

export function drizzleShippingRepository(executor: Executor = db): ShippingRepository {
  return {
    findAll: () => executor.select().from(shippingOptions).orderBy(desc(shippingOptions.createdAt)),
    findById: async (id) => (await executor.select().from(shippingOptions).where(eq(shippingOptions.id, id)))[0] ?? null,
    findByTitle: async (title) => (await executor.select().from(shippingOptions).where(ilike(shippingOptions.title, escapeLike(title))).limit(1))[0] ?? null,
    insert: async ({ title, detail, amount }) => (await executor.insert(shippingOptions).values({ title, detail, amount: amount.toFixed(2) }).returning())[0],
    update: async (ref, changes) => {
      const rows = await executor.update(shippingOptions).set({ ...columnsOf(changes), version: ref.version + 1, updatedAt: new Date() }).where(sameVersion(ref)).returning();
      return rows[0] ?? null;
    },
    remove: async (ref) => (await executor.delete(shippingOptions).where(sameVersion(ref)).returning({ id: shippingOptions.id })).length > 0,
    hasSales: async (id) => (await executor.select({ id: sales.id }).from(sales).where(eq(sales.shippingOptionId, id)).limit(1)).length > 0,
  };
}
