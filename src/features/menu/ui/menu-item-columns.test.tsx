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
  it('los gustos de empanadas y ciabattas remiten al precio del grupo', () => {
    expect(priceSummary(BASE)).toBe('Precio de Empanadas');
    expect(priceSummary({ ...BASE, group: 'ciabattas' })).toBe('Precio de Ciabattas');
  });

  it('un sanguche lista sus cuatro precios y una pizza el de la entera', () => {
    expect(priceSummary({ ...BASE, group: 'sanguches', price1: 1500, price3: 4200, price6: 8000, price12: 15000 })).toBe('1 unidad: $1.500 · 3 unidades: $4.200 · 6 unidades: $8.000 · 12 unidades: $15.000');
    expect(priceSummary({ ...BASE, group: 'pizzas', price1: 11000 })).toBe('pizza entera: $11.000');
  });
});

describe('fila de la grilla y tarjeta mobile (US-3 CA-5)', () => {
  it('muestra grupo, gusto, costo, precio y stock, y marca los inactivos', () => {
    const columns = getMenuItemColumns(rowActions());
    render(<div>{columns.slice(0, 5).map((column, index) => <span key={index}>{column.cell({ ...BASE, isActive: false })}</span>)}</div>);
    expect(columns.map((column) => column.header)).toEqual(['Grupo', 'Gusto / bebida', 'Costo', 'Precio', 'Stock', 'Acciones']);
    ['Empanadas', 'Carne', 'Inactivo', '$400', 'Precio de Empanadas', '24'].forEach((text) => expect(screen.getByText(text)).toBeDefined());
  });

  it('los botones de la fila editan, desactivan y borran', () => {
    const actions = rowActions();
    render(<div>{getMenuItemColumns(actions)[5].cell(BASE)}</div>);
    fireEvent.click(screen.getByTitle('Editar'));
    fireEvent.click(screen.getByTitle('Desactivar'));
    fireEvent.click(screen.getByTitle('Eliminar'));
    expect(actions.onEdit).toHaveBeenCalledWith(BASE);
    expect(actions.onToggleActive).toHaveBeenCalledWith(BASE);
    expect(actions.onDelete).toHaveBeenCalledWith('x');
  });

  it('la tarjeta mobile muestra el grupo, el resumen y las mismas acciones', () => {
    const actions = rowActions();
    render(renderMenuItemCard(actions)({ ...BASE, group: 'pizzas', name: 'Muzza', price1: 11000, isActive: false }));
    expect(screen.getByText('Pizzas')).toBeDefined();
    expect(screen.getByText('pizza entera: $11.000')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Acciones' }));
    fireEvent.click(screen.getByText('Activar'));
    expect(actions.onToggleActive).toHaveBeenCalled();
  });

  it('mostrar u ocultar en el catálogo y abrir las fotos (T-12)', () => {
    const actions = rowActions();
    const { unmount } = render(<div>{getMenuItemColumns(actions)[5].cell(BASE)}</div>);
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
