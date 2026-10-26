import { and, asc, eq, ilike, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cardPlans, cards } from '@/lib/db/card-schema';
import type { DbTransaction } from '@/lib/db/transaction';
import type { CardInput, CardPlan } from '@/features/card/domain/card.schema';

type CardRow = typeof cards.$inferSelect;
export type StoredPlan = { installments: number; surchargePct: string };
export type Card = CardRow & { plans: StoredPlan[] };
export type CardChanges = Partial<{ name: string; plans: CardPlan[]; isActive: boolean }>;
export type VersionedRef = { id: string; version: number };

export type CardRepository = {
  findAll(): Promise<Card[]>;
  findById(id: string): Promise<Card | null>;
  findByName(name: string): Promise<{ id: string } | null>;
  insert(input: CardInput): Promise<Card>;
  update(ref: VersionedRef, changes: CardChanges): Promise<Card | null>;
  remove(ref: VersionedRef): Promise<boolean>;
};

type Executor = typeof db | DbTransaction;

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`);
const sameVersion = ({ id, version }: VersionedRef) => and(eq(cards.id, id), eq(cards.version, version));
const stored = (plans: CardPlan[]): StoredPlan[] => plans.map(({ installments, surchargePct }) => ({ installments, surchargePct: surchargePct.toFixed(2) }));

async function withPlans(executor: Executor, rows: CardRow[]): Promise<Card[]> {
  const ids = rows.map((row) => row.id);
  const plans = ids.length === 0 ? [] : await executor.select().from(cardPlans).where(inArray(cardPlans.cardId, ids)).orderBy(asc(cardPlans.installments));
  const plansOf = (id: string): StoredPlan[] => plans.filter((plan) => plan.cardId === id).map(({ installments, surchargePct }) => ({ installments, surchargePct }));
  return rows.map((row) => ({ ...row, plans: plansOf(row.id) }));
}

async function writePlans(executor: Executor, cardId: string, plans: CardPlan[]): Promise<void> {
  await executor.delete(cardPlans).where(eq(cardPlans.cardId, cardId));
  await executor.insert(cardPlans).values(stored(plans).map((plan) => ({ ...plan, cardId })));
}

export function drizzleCardRepository(executor: Executor = db): CardRepository {
  return {
    findAll: async () => withPlans(executor, await executor.select().from(cards).orderBy(asc(cards.name))),
    findById: async (id) => (await withPlans(executor, await executor.select().from(cards).where(eq(cards.id, id))))[0] ?? null,
    findByName: async (name) => (await executor.select({ id: cards.id }).from(cards).where(ilike(cards.name, escapeLike(name))).limit(1))[0] ?? null,
    insert: async ({ name, plans }) => {
      const [row] = await executor.insert(cards).values({ name }).returning();
      await writePlans(executor, row.id, plans);
      return (await withPlans(executor, [row]))[0];
    },
    update: async (ref, { plans, ...changes }) => {
      const [row] = await executor.update(cards).set({ ...changes, version: ref.version + 1, updatedAt: new Date() }).where(sameVersion(ref)).returning();
      if (!row) return null;
      if (plans) await writePlans(executor, row.id, plans);
      return (await withPlans(executor, [row]))[0];
    },
    remove: async (ref) => (await executor.delete(cards).where(sameVersion(ref)).returning({ id: cards.id })).length > 0,
  };
}
