import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('acciones de Gastos (camino feliz)', () => {
  beforeEach(async () => {
    fakeExpenses.reset();
    await asUser({ role: 'admin' });
  });

  it('carga, lista, edita y borra un gasto con sus mensajes (CA-1 y CA-2)', async () => {
    const created = await createExpenseAction(EXPENSE_INPUT);
    expect(created).toMatchObject({ success: true, message: 'Se registró el gasto', data: { ...EXPENSE_INPUT, version: 1 } });
    const id = created.success ? created.data.id : '';
    expect(await fetchExpenses()).toMatchObject([{ id, invoiceNumber: EXPENSE_INPUT.invoiceNumber, amount: 18500.5 }]);
    expect(await updateExpenseAction(id, { ...EXPENSE_INPUT, title: 'Harina 50 kg', version: 1 })).toMatchObject({ success: true, message: 'Se actualizó el gasto', data: { title: 'Harina 50 kg', version: 2 } });
    expect(await deleteExpenseAction({ id, version: 2 })).toEqual({ success: true, message: 'Se eliminó el gasto' });
  });

  it('VALIDATION: editar con un id inválido', async () => {
    expect(await updateExpenseAction('no-es-un-uuid', { ...EXPENSE_INPUT, version: 1 })).toMatchObject({ code: 'VALIDATION' });
  });

  it('fuzz: ninguna entrada hace lanzar a cargar ni devuelve un error fuera del catálogo', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(createExpenseAction, undefined, [input]);
        expect(result.success || ['VALIDATION', 'DUPLICATE'].includes(result.code ?? '')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
