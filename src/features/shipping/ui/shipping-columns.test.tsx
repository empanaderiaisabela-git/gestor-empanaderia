import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ShippingDef } from '@/features/shipping/domain/shipping.schema';
import { renderShippingCard } from './shipping-card';
import { getShippingColumns, type ShippingRowActions } from './shipping-columns';

const CENTRO: ShippingDef = { id: 's1', title: 'Centro', detail: 'Barrio A hasta Barrio B', amount: 1500, isActive: false, version: 1, createdAt: '', updatedAt: '' };

function rowActions(): ShippingRowActions {
  return { onEdit: vi.fn(), onToggleActive: vi.fn(), onDelete: vi.fn() };
}

describe('grilla y tarjeta de Envíos (US-58 CA-3 y CA-4)', () => {
  it('muestra título, detalle y monto, y marca los inactivos', () => {
    const columns = getShippingColumns(rowActions());
    render(<div>{columns.slice(0, 3).map((column, index) => <span key={index}>{column.cell(CENTRO)}</span>)}</div>);
    expect(columns.map((column) => column.header)).toEqual(['Título', 'Detalle', 'Monto', 'Acciones']);
    ['Centro', 'Inactivo', 'Barrio A hasta Barrio B', '$1.500'].forEach((text) => expect(screen.getByText(text)).toBeDefined());
  });

  it('sin detalle muestra un guion', () => {
    render(<div>{getShippingColumns(rowActions())[1].cell({ ...CENTRO, detail: '' })}</div>);
    expect(screen.getByText('—')).toBeDefined();
  });

  it('los botones de la fila activan, editan y borran', () => {
    const actions = rowActions();
    render(<div>{getShippingColumns(actions)[3].cell(CENTRO)}</div>);
    fireEvent.click(screen.getByTitle('Activar'));
    fireEvent.click(screen.getByTitle('Editar'));
    fireEvent.click(screen.getByTitle('Eliminar'));
    expect([actions.onToggleActive, actions.onEdit].map((mock) => vi.mocked(mock).mock.calls[0][0])).toEqual([CENTRO, CENTRO]);
    expect(actions.onDelete).toHaveBeenCalledWith('s1');
  });

  it('la tarjeta mobile muestra el estado, el detalle con el monto y las mismas acciones', () => {
    const actions = rowActions();
    render(renderShippingCard(actions)({ ...CENTRO, isActive: true }));
    expect(screen.getByText('Activo')).toBeDefined();
    expect(screen.getByText('Barrio A hasta Barrio B · $1.500')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Acciones' }));
    fireEvent.click(screen.getByText('Desactivar'));
    fireEvent.click(screen.getByRole('button', { name: 'Acciones' }));
    fireEvent.click(screen.getByText('Eliminar'));
    expect(actions.onToggleActive).toHaveBeenCalled();
    expect(actions.onDelete).toHaveBeenCalledWith('s1');
  });
});
