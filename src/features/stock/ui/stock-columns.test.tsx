import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { getStockColumns, StockBadge, StockButtons } from './stock-columns';

const ITEM: MenuItemDef = { id: 'a', group: 'sanguches', name: 'Primavera', unitCost: 650, stock: 24, price1: 1600, price3: 4500, price6: 8600, price12: 16500, isActive: true, isVisible: false, isBase: false, version: 1, createdAt: '', updatedAt: '' };

describe('grilla de Stock (US-4 CA-1)', () => {
  it('muestra el costo para el local (US-16)', () => {
    expect(getStockColumns({ open: vi.fn() }).map((column) => column.header)).toEqual(['Grupo', 'Gusto / bebida', 'Stock', 'Precio de venta', 'Costo para el local', 'Acciones']);
  });

  it('cada celda muestra grupo, gusto, stock, precio y costo', () => {
    const columns = getStockColumns({ open: vi.fn() });
    render(<div>{columns.slice(0, 5).map((column, index) => <span key={index}>{column.cell(ITEM)}</span>)}</div>);
    ['Sanguches', 'Primavera', '24', '$650'].forEach((text) => expect(screen.getByText(text)).toBeDefined());
    expect(screen.getByText(/1 unidad: \$1\.600/)).toBeDefined();
    render(<div>{columns[5].cell(ITEM)}</div>);
    expect(screen.getAllByTitle('Ingresar stock')).toHaveLength(1);
  });

  it('avisa cuando falta el precio o el costo', () => {
    const sin: MenuItemDef = { ...ITEM, unitCost: null, price1: null, price3: null, price6: null, price12: null };
    const columns = getStockColumns({ open: vi.fn() });
    render(<div>{columns.slice(3, 5).map((column, index) => <span key={index}>{column.cell(sin)}</span>)}</div>);
    expect(screen.getByText('Sin precio')).toBeDefined();
    expect(screen.getByText('Sin costo')).toBeDefined();
  });

  it('muestra los precios del gusto de Empanadas, uno por renglón (US-28, BUG-22)', () => {
    const empanada: MenuItemDef = { ...ITEM, group: 'empanadas', price1: 2000, price3: 5500, price6: 10000, price12: 32000 };
    render(<div>{getStockColumns({ open: vi.fn() })[3].cell(empanada)}</div>);
    expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toEqual(['1 unidad: $2.000', '3 unidades: $5.500', '½ docena: $10.000', '1 docena: $32.000']);
  });

  it('muestra el stock y avisa cuando no hay', () => {
    render(
      <div>
        <StockBadge item={ITEM} />
        <StockBadge item={{ ...ITEM, id: 'b', stock: 0 }} />
      </div>
    );
    expect(screen.getByText('24')).toBeDefined();
    expect(screen.getByText('Sin stock')).toBeDefined();
  });

  it('el admin ingresa, registra mermas, cambia costo y precio y ve el historial (US-16, US-28)', () => {
    const open = vi.fn();
    render(<StockButtons item={ITEM} actions={{ open }} />);
    fireEvent.click(screen.getByTitle('Ingresar stock'));
    fireEvent.click(screen.getByTitle('Registrar pérdida'));
    fireEvent.click(screen.getByTitle('Costo y precio'));
    fireEvent.click(screen.getByTitle('Historial de ingresos'));
    expect(open.mock.calls).toEqual([[{ kind: 'entry', item: ITEM }], [{ kind: 'loss', item: ITEM }], [{ kind: 'pricing', item: ITEM }], [{ kind: 'history', item: ITEM }]]);
  });

  it('la base muestra su contador y sólo Ingresar stock y Registrar pérdida, sin precio ni costo (US-29 CA-2)', () => {
    const base: MenuItemDef = { ...ITEM, id: 'p', group: 'pizzas', name: 'Prepizza', unitCost: null, stock: 3, price1: null, price3: null, price6: null, price12: null, isBase: true };
    render(<div>{getStockColumns({ open: vi.fn() }).map((column, index) => <span key={index}>{column.cell(base)}</span>)}</div>);
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getAllByRole('button').map((button) => button.title)).toEqual(['Ingresar stock', 'Registrar pérdida']);
  });

  it('un gusto de pizza o ciabatta muestra "—" en Stock y sólo "Costo y precio" (US-29 CA-2)', () => {
    const open = vi.fn();
    const muzza: MenuItemDef = { ...ITEM, group: 'pizzas', name: 'Muzza', stock: 0, price1: 11000, price3: null, price6: null, price12: null };
    render(<div><StockBadge item={muzza} /><StockButtons item={muzza} actions={{ open }} /></div>);
    expect(screen.getByText('—')).toBeDefined();
    fireEvent.click(screen.getByRole('button'));
    expect(open).toHaveBeenCalledWith({ kind: 'pricing', item: muzza });
  });
});
