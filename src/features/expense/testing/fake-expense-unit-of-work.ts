import type { Expense, ExpenseRepository } from '@/features/expense/repository/expense.repository';
import type { ExpenseAuditEntry, ExpenseUnitOfWork } from '@/features/expense/repository/expense-unit-of-work';

type FakeState = { rows: Expense[]; audits: ExpenseAuditEntry[]; clock: number };

const pgError = (code: string, detail: string): Error => Object.assign(new Error(`Failed query (${code})`), { cause: { code, detail } });
const newest = (a: Expense, b: Expense): number => b.invoiceDate.localeCompare(a.invoiceDate) || b.createdAt.getTime() - a.createdAt.getTime();

export function fakeExpenseRepository(state: FakeState): ExpenseRepository {
  const byRef = (id: string, version: number): Expense | undefined => state.rows.find((row) => row.id === id && row.version === version);
  return {
    findAll: async () => [...state.rows].sort(newest).map((row) => ({ ...row })),
    findById: async (id) => state.rows.find((row) => row.id === id) ?? null,
    findByNumber: async (invoiceNumber) => state.rows.find((row) => row.invoiceNumber.toLowerCase() === invoiceNumber.toLowerCase()) ?? null,
    insert: async ({ amount, ...input }) => {
      if (state.rows.some((row) => row.invoiceNumber === input.invoiceNumber)) throw pgError('23505', 'Key (invoice_number) already exists.');
      state.clock += 1;
      const at = new Date(state.clock * 1000);
      const row: Expense = { id: crypto.randomUUID(), ...input, amount: amount.toFixed(2), version: 1, createdAt: at, updatedAt: at };
      state.rows.push(row);
      return { ...row };
    },
    update: async ({ id, version }, { amount, ...changes }) => {
      const row = byRef(id, version);
      if (!row) return null;
      Object.assign(row, changes, { amount: amount.toFixed(2), version: version + 1, updatedAt: new Date() });
      return { ...row };
    },
    remove: async ({ id, version }) => {
      const before = state.rows.length;
      state.rows = state.rows.filter((row) => !(row.id === id && row.version === version));
      return state.rows.length < before;
    },
  };
}

export type FakeExpenseUnitOfWork = ExpenseUnitOfWork & { state: FakeState; reset(): void };

export function createFakeExpenseUnitOfWork(): FakeExpenseUnitOfWork {
  const state: FakeState = { rows: [], audits: [], clock: 0 };
  const repository = fakeExpenseRepository(state);
  return {
    state,
    read: repository,
    run: (work) => work({ expenses: repository, audit: async (entry) => void state.audits.push(entry) }),
    reset: () => Object.assign(state, { rows: [], audits: [], clock: 0 }),
  };
}

export const fakeExpenses = createFakeExpenseUnitOfWork();
