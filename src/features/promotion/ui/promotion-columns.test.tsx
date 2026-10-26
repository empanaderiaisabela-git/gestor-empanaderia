import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PromotionDef } from '@/features/promotion/domain/promotion.schema';
import { renderPromotionCard } from './promotion-card';
import { getPromotionColumns, type PromotionRowActions } from './promotion-columns';

const PROMO: PromotionDef = { id: 'p1', name: 'Docena + Coca', price: 15000, isActive: false, version: 1, components: [{ group: 'empanadas', presentationKey: 'u12', quantity: 1 }], createdAt: '', updatedAt: '' };

function rowActions(): PromotionRowActions {
  return { onEdit: vi.fn(), onToggleActive: vi.fn(), onDelete: vi.fn() };
}

describe('grilla y tarjeta de Promociones (US-8)', () => {
  it('muestra nombre, contenido y precio de venta, y marca las inactivas', () => {
    const columns = getPromotionColumns(rowActions());
    render(<div>{columns.slice(0, 3).map((column, index) => <span key={index}>{column.cell(PROMO)}</span>)}</div>);
    expect(columns.map((column) => column.header)).toEqual(['Promoción', 'Contenido', 'Precio de venta', 'Acciones']);
    ['Docena + Coca', 'Inactiva', 'Empanadas · 1 docena', '$15.000'].forEach((text) => expect(screen.getByText(text)).toBeDefined());
  });

  it('los botones de la fila activan, editan y borran', () => {
    const actions = rowActions();
    render(<div>{getPromotionColumns(actions)[3].cell(PROMO)}</div>);
    fireEvent.click(screen.getByTitle('Activar'));
    fireEvent.click(screen.getByTitle('Editar'));
    fireEvent.click(screen.getByTitle('Eliminar'));
    expect([actions.onToggleActive, actions.onEdit].map((mock) => vi.mocked(mock).mock.calls[0][0])).toEqual([PROMO, PROMO]);
    expect(actions.onDelete).toHaveBeenCalledWith('p1');
  });

  it('la tarjeta mobile muestra el estado, el contenido y las mismas acciones', () => {
    const actions = rowActions();
    render(renderPromotionCard(actions)({ ...PROMO, isActive: true }));
    expect(screen.getByText('Activa')).toBeDefined();
    expect(screen.getByText('Empanadas · 1 docena')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Acciones' }));
    fireEvent.click(screen.getByText('Desactivar'));
    expect(actions.onToggleActive).toHaveBeenCalled();
  });
});
