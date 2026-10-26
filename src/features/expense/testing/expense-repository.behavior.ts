import { beforeEach, describe, expect, it } from 'vitest';
import { databaseErrorCode } from '@/lib/db-errors';
import type { ExpenseRepository } from '@/features/expense/repository/expense.repository';

export const EXPENSE_INPUT = { invoiceNumber: 'A-0001-00001234', title: 'Harina 25 kg', amount: 18500.5, invoiceDate: '2026-10-24' };
export type ExpenseRepositoryHarness = { repository: ExpenseRepository; userId: string };

async function failureCode(operation: Promise<unknown>): Promise<string | null> {
  return operation.then(
    () => 'sin error',
    (error: unknown) => databaseErrorCode(error)
  );
}

export function describeExpenseRepository(label: string, setup: () => Promise<ExpenseRepositoryHarness>): void {
  describe(`ExpenseRepository (${label}) — US-14 CA-1 y CA-2`, () => {
    let harness: ExpenseRepositoryHarness;
    const insert = (overrides: Partial<typeof EXPENSE_INPUT> = {}) => harness.repository.insert({ ...EXPENSE_INPUT, ...overrides, userId: harness.userId });

    beforeEach(async () => {
      harness = await setup();
    });

    it('guarda el gasto con versión 1, su monto y su fecha de factura', async () => {
      const created = await insert();
      expect(created).toMatchObject({ invoiceNumber: EXPENSE_INPUT.invoiceNumber, amount: '18500.50', invoiceDate: '2026-10-24', userId: harness.userId, version: 1 });
      expect(await harness.repository.findById(created.id)).toMatchObject({ title: 'Harina 25 kg' });
    });

    it('busca por número sin distinguir mayúsculas y rechaza un número repetido', async () => {
      await insert();
      expect(await harness.repository.findByNumber('a-0001-00001234')).not.toBeNull();
      expect(await failureCode(insert())).toBe('DUPLICATE');
    });

    it('edita y borra filtrando por versión', async () => {
      const created = await insert();
      expect(await harness.repository.update({ id: created.id, version: 1 }, { ...EXPENSE_INPUT, amount: 100 })).toMatchObject({ amount: '100.00', version: 2 });
      expect(await harness.repository.update({ id: created.id, version: 1 }, EXPENSE_INPUT)).toBeNull();
      expect(await harness.repository.remove({ id: created.id, version: 1 })).toBe(false);
      expect(await harness.repository.remove({ id: created.id, version: 2 })).toBe(true);
    });

    it('lista por fecha de la factura, la más nueva primero', async () => {
      await insert({ invoiceNumber: '1', invoiceDate: '2026-10-20' });
      await insert({ invoiceNumber: '2', invoiceDate: '2026-10-25' });
      await insert({ invoiceNumber: '3', invoiceDate: '2026-10-22' });
      expect((await harness.repository.findAll()).map((row) => row.invoiceNumber)).toEqual(['2', '3', '1']);
    });
  });
}
