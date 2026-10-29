import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { asUser } from '@/test/as-user';
import { EXPENSE_INPUT } from '../testing/expense-repository.behavior';
import { fakeExpenses } from '../testing/fake-expense-unit-of-work';
import { createExpenseAction } from './create-expense';
import { deleteExpenseAction } from './delete-expense';
import { fetchExpenses } from './fetch-expenses';
import { updateExpenseAction } from './update-expense';

vi.mock('@/features/expense/repository/expense-unit-of-work', async () => {
  const { fakeExpenses: fake } = await import('../testing/fake-expense-unit-of-work');
  return { drizzleExpenseUnitOfWork: fake };
});

const { DATABASE, VALIDATION } = MESSAGES.ERROR;
const ADMIN = '00000000-0000-4000-8000-00000000000a';

async function existingExpense(): Promise<string> {
  return (await fakeExpenses.read.insert({ ...EXPENSE_INPUT, userId: ADMIN })).id;
}

describe('tabla de errores de Gastos (US-14 CA-3)', () => {
  beforeEach(() => {
    fakeExpenses.reset();
  });

  it('UNAUTHENTICATED: sin sesión no se carga', async () => {
    expect(await createExpenseAction(EXPENSE_INPUT)).toEqual({ success: false, code: 'UNAUTHENTICATED', error: 'No autorizado (Token faltante)' });
  });

  it('FORBIDDEN: el vendedor no carga, edita ni borra, y no ve la lista', async () => {
    const id = await existingExpense();
    await asUser({ role: 'vendedor' });
    const results = await Promise.all([createExpenseAction(EXPENSE_INPUT), updateExpenseAction(id, { ...EXPENSE_INPUT, version: 1 }), deleteExpenseAction({ id, version: 1 })]);
    expect(results.map((result) => (result.success ? 'ok' : result.code))).toEqual(['FORBIDDEN', 'FORBIDDEN', 'FORBIDDEN']);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await fetchExpenses()).toEqual([]);
  });

  it.each([
    { caso: 'monto 0', input: { ...EXPENSE_INPUT, amount: 0 } },
    { caso: 'sin número', input: { ...EXPENSE_INPUT, invoiceNumber: '' } },
    { caso: 'sin proveedor', input: { ...EXPENSE_INPUT, providerId: '' } },
    { caso: 'fecha inválida', input: { ...EXPENSE_INPUT, invoiceDate: '2026-13-01' } },
  ])('VALIDATION: $caso', async ({ input }) => {
    await asUser({ role: 'admin' });
    expect(await createExpenseAction(input)).toEqual({ success: false, code: 'VALIDATION', error: VALIDATION.INVALID_DATA });
  });

  it('RELATION_NOT_FOUND: avisa que el proveedor no existe', async () => {
    await asUser({ role: 'admin' });
    expect(await createExpenseAction({ ...EXPENSE_INPUT, providerId: crypto.randomUUID() })).toEqual({ success: false, code: 'RELATION_NOT_FOUND', error: DATABASE.RELATION_NOT_FOUND });
  });

  it('DUPLICATE: avisa que ya existe una factura con ese número', async () => {
    await existingExpense();
    await asUser({ role: 'admin' });
    expect(await createExpenseAction(EXPENSE_INPUT)).toEqual({ success: false, code: 'DUPLICATE', error: DATABASE.UNIQUE_VIOLATION });
  });

  it('STALE_VERSION: editar o borrar con una versión vieja', async () => {
    const id = await existingExpense();
    await asUser({ role: 'admin' });
    const results = await Promise.all([updateExpenseAction(id, { ...EXPENSE_INPUT, version: 7 }), deleteExpenseAction({ id, version: 7 })]);
    expect(results).toEqual(Array(2).fill({ success: false, code: 'STALE_VERSION', error: DATABASE.CONCURRENCY }));
  });
});
