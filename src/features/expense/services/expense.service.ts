import { AppError } from '@/lib/errors';
import type { ExpenseDeleteInput, ExpenseInput, ExpenseUpdateInput } from '@/features/expense/domain/expense.schema';
import type { Expense } from '@/features/expense/repository/expense.repository';
import { drizzleExpenseUnitOfWork, type ExpenseScope, type ExpenseUnitOfWork } from '@/features/expense/repository/expense-unit-of-work';

type Caller = { id: string };

export type ExpenseService = {
  list(): Promise<Expense[]>;
  create(caller: Caller, input: ExpenseInput): Promise<Expense>;
  update(caller: Caller, id: string, input: ExpenseUpdateInput): Promise<Expense>;
  remove(caller: Caller, input: ExpenseDeleteInput): Promise<void>;
};

const orStale = (expense: Expense | null): Expense => {
  if (!expense) throw new AppError('STALE_VERSION');
  return expense;
};

const summary = ({ invoiceNumber, title, amount, invoiceDate }: Expense): Record<string, unknown> => ({ name: title, invoiceNumber, amount: Number(amount), invoiceDate });

async function assertFreeNumber({ expenses }: ExpenseScope, invoiceNumber: string, ownId: string | null): Promise<void> {
  const same = await expenses.findByNumber(invoiceNumber);
  if (same && same.id !== ownId) throw new AppError('DUPLICATE');
}

async function createExpense(scope: ExpenseScope, caller: Caller, input: ExpenseInput): Promise<Expense> {
  await assertFreeNumber(scope, input.invoiceNumber, null);
  const expense = await scope.expenses.insert({ ...input, userId: caller.id });
  await scope.audit({ userId: caller.id, action: 'CREAR', entityId: expense.id, detail: summary(expense) });
  return expense;
}

async function updateExpense(scope: ExpenseScope, caller: Caller, { id, input }: { id: string; input: ExpenseUpdateInput }): Promise<Expense> {
  const { version, ...changes } = input;
  await assertFreeNumber(scope, changes.invoiceNumber, id);
  const expense = orStale(await scope.expenses.update({ id, version }, changes));
  await scope.audit({ userId: caller.id, action: 'ACTUALIZAR', entityId: id, detail: summary(expense) });
  return expense;
}

async function removeExpense({ expenses, audit }: ExpenseScope, caller: Caller, ref: ExpenseDeleteInput): Promise<void> {
  const expense = orStale(await expenses.findById(ref.id));
  if (!(await expenses.remove(ref))) throw new AppError('STALE_VERSION');
  await audit({ userId: caller.id, action: 'ELIMINAR', entityId: ref.id, detail: { ...summary(expense), note: 'Eliminación permanente' } });
}

export function createExpenseService({ unitOfWork }: { unitOfWork: ExpenseUnitOfWork }): ExpenseService {
  return {
    list: () => unitOfWork.read.findAll(),
    create: (caller, input) => unitOfWork.run((scope) => createExpense(scope, caller, input)),
    update: (caller, id, input) => unitOfWork.run((scope) => updateExpense(scope, caller, { id, input })),
    remove: (caller, input) => unitOfWork.run((scope) => removeExpense(scope, caller, input)),
  };
}

export const expenseService = createExpenseService({ unitOfWork: drizzleExpenseUnitOfWork });
