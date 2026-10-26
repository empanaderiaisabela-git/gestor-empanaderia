import { and, desc, eq, ilike } from 'drizzle-orm';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db/expense-schema';
import type { DbTransaction } from '@/lib/db/transaction';
import type { ExpenseInput } from '@/features/expense/domain/expense.schema';

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = ExpenseInput & { userId: string };
export type VersionedRef = { id: string; version: number };

export type ExpenseRepository = {
  findAll(): Promise<Expense[]>;
  findById(id: string): Promise<Expense | null>;
  findByNumber(invoiceNumber: string): Promise<{ id: string } | null>;
  insert(input: NewExpense): Promise<Expense>;
  update(ref: VersionedRef, changes: ExpenseInput): Promise<Expense | null>;
  remove(ref: VersionedRef): Promise<boolean>;
};

type Executor = typeof db | DbTransaction;

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`);
const sameVersion = ({ id, version }: VersionedRef) => and(eq(expenses.id, id), eq(expenses.version, version));
const columns = ({ amount, ...input }: ExpenseInput) => ({ ...input, amount: amount.toFixed(2) });

export function drizzleExpenseRepository(executor: Executor = db): ExpenseRepository {
  return {
    findAll: () => executor.select().from(expenses).orderBy(desc(expenses.invoiceDate), desc(expenses.createdAt)),
    findById: async (id) => (await executor.select().from(expenses).where(eq(expenses.id, id)))[0] ?? null,
    findByNumber: async (invoiceNumber) => (await executor.select({ id: expenses.id }).from(expenses).where(ilike(expenses.invoiceNumber, escapeLike(invoiceNumber))).limit(1))[0] ?? null,
    insert: async ({ userId, ...input }) => (await executor.insert(expenses).values({ ...columns(input), userId }).returning())[0],
    update: async (ref, changes) => {
      const rows = await executor.update(expenses).set({ ...columns(changes), version: ref.version + 1, updatedAt: new Date() }).where(sameVersion(ref)).returning();
      return rows[0] ?? null;
    },
    remove: async (ref) => (await executor.delete(expenses).where(sameVersion(ref)).returning({ id: expenses.id })).length > 0,
  };
}
