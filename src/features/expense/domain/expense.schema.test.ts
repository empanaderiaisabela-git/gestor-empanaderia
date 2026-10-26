import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { expenseCreateSchema, expenseDeleteSchema, expenseRowSchema, expenseUpdateSchema } from './expense.schema';

const EXPENSE = { invoiceNumber: 'A-0001-00001234', title: 'Harina 25 kg', amount: 18500.5, invoiceDate: '2026-10-24' };
const ID = '11111111-1111-4111-8111-111111111111';

function messages(input: unknown): string[] {
  const result = expenseCreateSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('expenseCreateSchema (US-14 CA-1)', () => {
  it('acepta número, título, monto y fecha de la factura, sin espacios de más', () => {
    expect(expenseCreateSchema.parse({ ...EXPENSE, invoiceNumber: '  A-0001-00001234 ', title: ' Harina 25 kg ' })).toEqual(EXPENSE);
  });

  it('acepta los límites: número de 30, título de 100 y monto de un centavo', () => {
    expect(messages({ ...EXPENSE, invoiceNumber: '1'.repeat(30), title: 'T'.repeat(100), amount: 0.01 })).toEqual([]);
  });

  it.each([
    { caso: 'número vacío', input: { ...EXPENSE, invoiceNumber: ' ' }, message: 'El número de factura es obligatorio' },
    { caso: 'número de 31', input: { ...EXPENSE, invoiceNumber: '1'.repeat(31) }, message: 'El número de factura no puede superar los 30 caracteres' },
    { caso: 'título vacío', input: { ...EXPENSE, title: '' }, message: 'El título es obligatorio' },
    { caso: 'título de 101', input: { ...EXPENSE, title: 'T'.repeat(101) }, message: 'El título no puede superar los 100 caracteres' },
    { caso: 'monto 0', input: { ...EXPENSE, amount: 0 }, message: 'El monto debe ser mayor a 0' },
    { caso: 'monto con 3 decimales', input: { ...EXPENSE, amount: 1.555 }, message: 'Máximo 2 decimales' },
    { caso: 'fecha inexistente', input: { ...EXPENSE, invoiceDate: '2026-02-30' }, message: 'Elegí una fecha válida' },
    { caso: 'fecha con otro formato', input: { ...EXPENSE, invoiceDate: '24/10/2026' }, message: 'Elegí una fecha válida' },
  ])('rechaza $caso con el mensaje exacto', ({ input, message }) => {
    expect(messages(input)).toContain(message);
  });

  it('rechaza campos de más (strictObject) y aguanta cualquier entrada (fuzz)', () => {
    expect(expenseCreateSchema.safeParse({ ...EXPENSE, photo: 'x' }).success).toBe(false);
    fc.assert(fc.property(fc.anything(), (input) => typeof expenseCreateSchema.safeParse(input).success === 'boolean'));
  });
});

describe('schemas de edición, borrado y fila', () => {
  it('editar pide todo de nuevo más la versión; borrar, un id válido y la versión', () => {
    expect(expenseUpdateSchema.safeParse({ ...EXPENSE, version: 1 }).success).toBe(true);
    expect(expenseUpdateSchema.safeParse(EXPENSE).success).toBe(false);
    expect(expenseDeleteSchema.safeParse({ id: ID, version: 1 }).success).toBe(true);
    expect(expenseDeleteSchema.safeParse({ id: 'x', version: 1 }).success).toBe(false);
  });

  it('la fila convierte a número el monto que Postgres devuelve como texto', () => {
    const row = { id: ID, ...EXPENSE, amount: '18500.50', version: 1, createdAt: new Date(0), updatedAt: new Date(0) };
    expect(expenseRowSchema.parse(row)).toMatchObject({ amount: 18500.5, invoiceDate: '2026-10-24' });
  });
});
