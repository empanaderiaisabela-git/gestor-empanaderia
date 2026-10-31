import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { pizzaExtras } from '@/lib/db/menu-schema';
import { type DbTransaction, withTransaction } from '@/lib/db/transaction';
import { HAM_CODE, type HamPriceInput } from '@/features/menu/domain/pizza-extra.schema';

export type PizzaExtra = typeof pizzaExtras.$inferSelect;
export type PizzaExtraRepository = {
  findHam(): Promise<PizzaExtra | null>;
  saveHam(input: HamPriceInput): Promise<PizzaExtra | null>;
};
export type PizzaExtraAudit = { userId: string; action: 'ACTUALIZAR'; entity: 'PIZZA_EXTRA'; entityId: null; detail: Record<string, unknown> };
export type PizzaExtraScope = { extras: PizzaExtraRepository; audit: (entry: PizzaExtraAudit) => Promise<void> };
export type PizzaExtraUnitOfWork = { read: PizzaExtraRepository; run<T>(work: (scope: PizzaExtraScope) => Promise<T>): Promise<T> };

type Executor = typeof db | DbTransaction;

export function drizzlePizzaExtraRepository(executor: Executor = db): PizzaExtraRepository {
  return {
    findHam: async () => (await executor.select().from(pizzaExtras).where(eq(pizzaExtras.code, HAM_CODE)))[0] ?? null,
    saveHam: async ({ price, version }) => {
      const values = { price: price.toFixed(2), updatedAt: new Date() };
      if (version === 0) return (await executor.insert(pizzaExtras).values({ code: HAM_CODE, ...values }).onConflictDoNothing().returning())[0] ?? null;
      return (await executor.update(pizzaExtras).set({ ...values, version: version + 1 }).where(and(eq(pizzaExtras.code, HAM_CODE), eq(pizzaExtras.version, version))).returning())[0] ?? null;
    },
  };
}

export const drizzlePizzaExtraUnitOfWork: PizzaExtraUnitOfWork = {
  read: drizzlePizzaExtraRepository(db),
  run: (work) => withTransaction((tx) => work({ extras: drizzlePizzaExtraRepository(tx), audit: async (entry) => void (await tx.insert(auditLogs).values(entry)) })),
};
