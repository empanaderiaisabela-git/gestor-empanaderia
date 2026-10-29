import { beforeEach, describe, expect, it } from 'vitest';
import { EXPENSE_PROVIDER } from '../testing/expense-provider';
import { EXPENSE_INPUT } from '../testing/expense-repository.behavior';
import { createFakeExpenseUnitOfWork, type FakeExpenseUnitOfWork } from '../testing/fake-expense-unit-of-work';
import { createExpenseService, type ExpenseService } from './expense.service';

const CALLER = { id: '00000000-0000-4000-8000-00000000000a' };

describe('expense.service (US-14)', () => {
  let fake: FakeExpenseUnitOfWork;
  let service: ExpenseService;

  beforeEach(() => {
    fake = createFakeExpenseUnitOfWork();
    service = createExpenseService({ unitOfWork: fake });
  });

  it('anota el gasto a nombre de quien lo carga y audita CREAR (CA-1 y CA-3)', async () => {
    const expense = await service.create(CALLER, EXPENSE_INPUT);
    expect(expense).toMatchObject({ userId: CALLER.id, amount: '18500.50', version: 1 });
    expect(fake.state.audits).toEqual([{ userId: CALLER.id, action: 'CREAR', entityId: expense.id, detail: { name: 'Harina 25 kg', invoiceNumber: EXPENSE_INPUT.invoiceNumber, amount: 18500.5, invoiceDate: '2026-10-24', provider: EXPENSE_PROVIDER.name } }]);
  });

  it('DUPLICATE: un número de factura repetido, sin distinguir mayúsculas, al cargar o al editar', async () => {
    await service.create(CALLER, EXPENSE_INPUT);
    await expect(service.create(CALLER, { ...EXPENSE_INPUT, invoiceNumber: 'a-0001-00001234' })).rejects.toMatchObject({ code: 'DUPLICATE' });
    const other = await service.create(CALLER, { ...EXPENSE_INPUT, invoiceNumber: 'B-1' });
    await expect(service.update(CALLER, other.id, { ...EXPENSE_INPUT, version: 1 })).rejects.toMatchObject({ code: 'DUPLICATE' });
  });

  it('edita con su versión conservando su número, y borra con la eliminación permanente (CA-2)', async () => {
    const expense = await service.create(CALLER, EXPENSE_INPUT);
    expect(await service.update(CALLER, expense.id, { ...EXPENSE_INPUT, amount: 20000, version: 1 })).toMatchObject({ amount: '20000.00', version: 2 });
    await service.remove(CALLER, { id: expense.id, version: 2 });
    expect(await service.list()).toEqual([]);
    expect(fake.state.audits.map((entry) => entry.action)).toEqual(['CREAR', 'ACTUALIZAR', 'ELIMINAR']);
  });

  it('RELATION_NOT_FOUND: un proveedor que no existe', async () => {
    await expect(service.create(CALLER, { ...EXPENSE_INPUT, providerId: crypto.randomUUID() })).rejects.toMatchObject({ cause: { code: '23503' } });
  });

  it.each([
    { caso: 'editar', run: (s: ExpenseService, id: string) => s.update(CALLER, id, { ...EXPENSE_INPUT, version: 9 }) },
    { caso: 'borrar', run: (s: ExpenseService, id: string) => s.remove(CALLER, { id, version: 9 }) },
    { caso: 'borrar uno que ya no existe', run: (s: ExpenseService) => s.remove(CALLER, { id: crypto.randomUUID(), version: 1 }) },
  ])('STALE_VERSION: $caso', async ({ run }) => {
    const expense = await service.create(CALLER, EXPENSE_INPUT);
    await expect(run(service, expense.id)).rejects.toMatchObject({ code: 'STALE_VERSION' });
  });
});
