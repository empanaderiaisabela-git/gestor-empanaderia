import { describe, expect, it } from 'vitest';
import { formatInvoiceDate, initialValues, parseCreate, parseUpdate } from './expense-form';

const VALUES = { invoiceNumber: 'A-1', title: 'Harina', amount: '18500,50', invoiceDate: '2026-10-24' };

describe('formulario de Gastos (US-14 CA-1)', () => {
  it('un gasto nuevo arranca con la fecha de hoy; al editar trae lo guardado', () => {
    expect(initialValues(null, '2026-10-26')).toEqual({ invoiceNumber: '', title: '', amount: '', invoiceDate: '2026-10-26' });
    const expense = { id: 'e', invoiceNumber: 'A-1', title: 'Harina', amount: 18500.5, invoiceDate: '2026-10-24', version: 2, createdAt: '', updatedAt: '' };
    expect(initialValues(expense, '2026-10-26')).toEqual({ ...VALUES, amount: '18500.5' });
  });

  it('convierte el monto con coma; al editar manda la versión', () => {
    expect(parseCreate(VALUES)).toEqual({ ok: true, input: { ...VALUES, amount: 18500.5 } });
    expect(parseUpdate(VALUES, 3)).toMatchObject({ ok: true, input: { version: 3 } });
  });

  it('marca el error de cada campo', () => {
    expect(parseCreate({ invoiceNumber: '', title: '', amount: '', invoiceDate: '' })).toEqual({
      ok: false,
      errors: { invoiceNumber: 'El número de factura es obligatorio', title: 'El título es obligatorio', amount: 'Ingresá un monto válido', invoiceDate: 'Elegí una fecha válida' },
    });
  });

  it('muestra la fecha de la factura como DD/MM/AAAA', () => {
    expect(formatInvoiceDate('2026-10-24')).toBe('24/10/2026');
  });
});
