import { and, desc, eq, getTableColumns, ilike } from 'drizzle-orm';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db/expense-schema';
import { providers } from '@/lib/db/schema';
import type { DbTransaction } from '@/lib/db/transaction';
import { AppError } from '@/lib/errors';
import type { ExpenseInput } from '@/features/expense/domain/expense.schema';

export type Expense = typeof expenses.$inferSelect & { providerName: string | null };
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
const found = (expense: Expense | null): Expense => {
  if (!expense) throw new AppError('UNEXPECTED');
  return expense;
};
const withProvider = { ...getTableColumns(expenses), providerName: providers.name };

export function drizzleExpenseRepository(executor: Executor = db): ExpenseRepository {
  const selectExpenses = () => executor.select(withProvider).from(expenses).leftJoin(providers, eq(expenses.providerId, providers.id));
  const findById = async (id: string): Promise<Expense | null> => (await selectExpenses().where(eq(expenses.id, id)))[0] ?? null;
  return {
    findAll: () => selectExpenses().orderBy(desc(expenses.invoiceDate), desc(expenses.createdAt)),
    findById,
    findByNumber: async (invoiceNumber) => (await executor.select({ id: expenses.id }).from(expenses).where(ilike(expenses.invoiceNumber, escapeLike(invoiceNumber))).limit(1))[0] ?? null,
    insert: async ({ userId, ...input }) => {
      const [created] = await executor.insert(expenses).values({ ...columns(input), userId }).returning({ id: expenses.id });
      return found(await findById(created.id));
    },
    update: async (ref, changes) => {
      const rows = await executor.update(expenses).set({ ...columns(changes), version: ref.version + 1, updatedAt: new Date() }).where(sameVersion(ref)).returning({ id: expenses.id });
      return rows[0] ? findById(rows[0].id) : null;
    },
    remove: async (ref) => (await executor.delete(expenses).where(sameVersion(ref)).returning({ id: expenses.id })).length > 0,
  };
}
