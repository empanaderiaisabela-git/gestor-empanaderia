import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { renderMenuItemCard } from './menu-item-card';
import { priceSummary } from '@/features/menu/domain/menu-price-list';
import { getMenuItemColumns, type MenuItemRowActions } from './menu-item-columns';

const BASE: MenuItemDef = { id: 'x', group: 'empanadas', name: 'Carne', unitCost: 400, stock: 24, price1: null, price3: null, price6: null, price12: null, isActive: true, isVisible: false, version: 1, createdAt: '', updatedAt: '' };

function rowActions(): MenuItemRowActions {
  return { onEdit: vi.fn(), onToggleActive: vi.fn(), onDelete: vi.fn(), onToggleVisible: vi.fn(), onPhotos: vi.fn() };
}

describe('resumen de precios de la grilla', () => {
  it('las empanadas listan los precios que reciben, los del grupo (US-23)', () => {
    expect(priceSummary('empanadas', { price1: 2000, price3: 5500, price6: 10000, price12: 32000 })).toBe('1 unidad: $2.000 · 3 unidades: $5.500 · ½ docena: $10.000 · 1 docena: $32.000');
  });

  it('un sanguche lista sus cuatro precios y una pizza el de la entera', () => {
    expect(priceSummary('sanguches', { price1: 1500, price3: 4200, price6: 8000, price12: 15000 })).toBe('1 unidad: $1.500 · 3 unidades: $4.200 · 6 unidades: $8.000 · 12 unidades: $15.000');
    expect(priceSummary('pizzas', { price1: 11000 })).toBe('pizza entera: $11.000');
  });
});

describe('fila de la grilla y tarjeta mobile (US-3 CA-5)', () => {
  it('muestra grupo, gusto y stock, y marca los inactivos', () => {
    const columns = getMenuItemColumns(rowActions());
    render(<div>{columns.slice(0, 3).map((column, index) => <span key={index}>{column.cell({ ...BASE, isActive: false })}</span>)}</div>);
    expect(columns.map((column) => column.header)).toEqual(['Grupo', 'Gusto / bebida', 'Stock', 'Acciones']);
    ['Empanadas', 'Carne', 'Inactivo', '24'].forEach((text) => expect(screen.getByText(text)).toBeDefined());
  });

  it('los botones de la fila editan, desactivan y borran', () => {
    const actions = rowActions();
    render(<div>{getMenuItemColumns(actions)[3].cell(BASE)}</div>);
    fireEvent.click(screen.getByTitle('Editar'));
    fireEvent.click(screen.getByTitle('Desactivar'));
    fireEvent.click(screen.getByTitle('Eliminar'));
    expect(actions.onEdit).toHaveBeenCalledWith(BASE);
    expect(actions.onToggleActive).toHaveBeenCalledWith(BASE);
    expect(actions.onDelete).toHaveBeenCalledWith('x');
  });

  it('la tarjeta mobile muestra el grupo, el stock y las mismas acciones', () => {
    const actions = rowActions();
    render(renderMenuItemCard(actions)({ ...BASE, group: 'pizzas', name: 'Muzza', price1: 11000, isActive: false }));
    expect(screen.getByText('Pizzas')).toBeDefined();
    expect(screen.getByText('Stock 24')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Acciones' }));
    fireEvent.click(screen.getByText('Activar'));
    expect(actions.onToggleActive).toHaveBeenCalled();
  });

  it('mostrar u ocultar en el catálogo y abrir las fotos (T-12)', () => {
    const actions = rowActions();
    const { unmount } = render(<div>{getMenuItemColumns(actions)[3].cell(BASE)}</div>);
    fireEvent.click(screen.getByTitle('Mostrar en el catálogo'));
    fireEvent.click(screen.getByTitle('Fotos'));
    expect(actions.onToggleVisible).toHaveBeenCalledWith(BASE);
    expect(actions.onPhotos).toHaveBeenCalledWith(BASE);
    unmount();
    const shown = { ...BASE, isVisible: true };
    render(<div>{getMenuItemColumns(actions).map((column, index) => <span key={index}>{column.cell(shown)}</span>)}</div>);
    expect(screen.getByText('En catálogo')).toBeDefined();
    expect(screen.getByTitle('Ocultar del catálogo')).toBeDefined();
  });

  it('la tarjeta mobile también muestra u oculta y abre las fotos', () => {
    const actions = rowActions();
    render(renderMenuItemCard(actions)({ ...BASE, isVisible: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Acciones' }));
    fireEvent.click(screen.getByText('Ocultar del catálogo'));
    fireEvent.click(screen.getByRole('button', { name: 'Acciones' }));
    fireEvent.click(screen.getByText('Fotos'));
    expect([vi.mocked(actions.onToggleVisible).mock.calls.length, vi.mocked(actions.onPhotos).mock.calls.length]).toEqual([1, 1]);
  });
});
