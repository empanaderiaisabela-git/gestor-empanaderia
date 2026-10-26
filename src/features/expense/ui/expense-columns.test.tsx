import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ExpenseDef } from '@/features/expense/domain/expense.schema';
import { renderExpenseCard } from './expense-card';
import { type ExpenseRowActions, getExpenseColumns } from './expense-columns';

const HARINA: ExpenseDef = { id: 'e1', invoiceNumber: 'A-0001', title: 'Harina 25 kg', amount: 18500, invoiceDate: '2026-10-24', version: 1, createdAt: '', updatedAt: '' };

function rowActions(): ExpenseRowActions {
  return { onEdit: vi.fn(), onDelete: vi.fn() };
}

describe('grilla y tarjeta mobile de Gastos (US-14 CA-2)', () => {
  it('muestra la fecha de la factura, el número, el título y el monto', () => {
    const columns = getExpenseColumns(rowActions());
    render(<div>{columns.slice(0, 4).map((column, index) => <span key={index}>{column.cell(HARINA)}</span>)}</div>);
    expect(columns.map((column) => column.header)).toEqual(['Fecha de la factura', 'Número', 'Título', 'Monto', 'Acciones']);
    ['24/10/2026', 'A-0001', 'Harina 25 kg', '$18.500'].forEach((text) => expect(screen.getByText(text)).toBeDefined());
  });

  it('los botones editan y borran, también en la tarjeta mobile', () => {
    const actions = rowActions();
    render(<div>{getExpenseColumns(actions)[4].cell(HARINA)}</div>);
    fireEvent.click(screen.getByTitle('Editar'));
    fireEvent.click(screen.getByTitle('Eliminar'));
    expect([vi.mocked(actions.onEdit).mock.calls[0][0], vi.mocked(actions.onDelete).mock.calls[0][0]]).toEqual([HARINA, 'e1']);
    render(renderExpenseCard(actions)(HARINA));
    expect(screen.getByText('Factura A-0001 · $18.500')).toBeDefined();
  });
});
