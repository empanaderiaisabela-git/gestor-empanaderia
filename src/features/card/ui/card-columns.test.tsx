import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CardDef } from '@/features/card/domain/card.schema';
import { renderCardCard } from './card-card';
import { type CardRowActions, getCardColumns } from './card-columns';

const VISA: CardDef = { id: 'c1', name: 'Visa', isActive: false, version: 1, plans: [{ installments: 3, surchargePct: 10 }, { installments: 1, surchargePct: 0 }], createdAt: '', updatedAt: '' };

function rowActions(): CardRowActions {
  return { onEdit: vi.fn(), onToggleActive: vi.fn(), onDelete: vi.fn() };
}

describe('grilla y tarjeta mobile de Tarjetas (US-10)', () => {
  it('muestra el nombre, los planes con su recargo y marca las inactivas', () => {
    const columns = getCardColumns(rowActions());
    render(<div>{columns.slice(0, 2).map((column, index) => <span key={index}>{column.cell(VISA)}</span>)}</div>);
    expect(columns.map((column) => column.header)).toEqual(['Tarjeta', 'Planes de cuotas', 'Acciones']);
    ['Visa', 'Inactiva', '1 cuota sin recargo · 3 cuotas +10 %'].forEach((text) => expect(screen.getByText(text)).toBeDefined());
  });

  it('los botones de la fila activan, editan y borran', () => {
    const actions = rowActions();
    render(<div>{getCardColumns(actions)[2].cell(VISA)}</div>);
    fireEvent.click(screen.getByTitle('Activar'));
    fireEvent.click(screen.getByTitle('Editar'));
    fireEvent.click(screen.getByTitle('Eliminar'));
    expect([vi.mocked(actions.onToggleActive).mock.calls.length, vi.mocked(actions.onEdit).mock.calls.length]).toEqual([1, 1]);
    expect(actions.onDelete).toHaveBeenCalledWith('c1');
  });

  it('la tarjeta mobile muestra el estado, los planes y las acciones', () => {
    const actions = rowActions();
    render(renderCardCard(actions)({ ...VISA, isActive: true }));
    expect(screen.getByText('Activa')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Acciones' }));
    fireEvent.click(screen.getByText('Desactivar'));
    expect(actions.onToggleActive).toHaveBeenCalled();
  });
});
