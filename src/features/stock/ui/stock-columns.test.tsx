import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { getStockColumns, StockBadge, StockButtons } from './stock-columns';

const ITEM: MenuItemDef = { id: 'a', group: 'sanguches', name: 'Primavera', unitCost: 650, stock: 24, price1: 1600, price3: 4500, price6: 8600, price12: 16500, isActive: true, version: 1, createdAt: '', updatedAt: '' };

describe('grilla de Stock (US-4 CA-1)', () => {
  it('el admin ve el costo; el vendedor no', () => {
    expect(getStockColumns({ isAdmin: true, open: vi.fn() }).map((column) => column.header)).toEqual(['Grupo', 'Gusto / bebida', 'Stock', 'Precio', 'Costo', 'Acciones']);
    expect(getStockColumns({ isAdmin: false, open: vi.fn() }).map((column) => column.header)).toEqual(['Grupo', 'Gusto / bebida', 'Stock', 'Precio', 'Acciones']);
  });

  it('cada celda muestra grupo, gusto, stock, precio y costo', () => {
    const columns = getStockColumns({ isAdmin: true, open: vi.fn() });
    render(<div>{columns.slice(0, 5).map((column, index) => <span key={index}>{column.cell(ITEM)}</span>)}</div>);
    ['Sanguches', 'Primavera', '24', '$650'].forEach((text) => expect(screen.getByText(text)).toBeDefined());
    expect(screen.getByText(/1 unidad: \$1\.600/)).toBeDefined();
    render(<div>{columns[5].cell(ITEM)}</div>);
    expect(screen.getAllByTitle('Ingresar stock')).toHaveLength(1);
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

  it('el vendedor puede ingresar y ver el historial, pero no registrar mermas', () => {
    const open = vi.fn();
    render(<StockButtons item={ITEM} actions={{ isAdmin: false, open }} />);
    expect(screen.queryByTitle('Registrar merma')).toBeNull();
    fireEvent.click(screen.getByTitle('Ingresar stock'));
    fireEvent.click(screen.getByTitle('Historial de ingresos'));
    expect(open.mock.calls).toEqual([[{ kind: 'entry', item: ITEM }], [{ kind: 'history', item: ITEM }]]);
  });

  it('el admin además registra mermas', () => {
    const open = vi.fn();
    render(<StockButtons item={ITEM} actions={{ isAdmin: true, open }} />);
    fireEvent.click(screen.getByTitle('Registrar merma'));
    expect(open).toHaveBeenCalledWith({ kind: 'loss', item: ITEM });
  });
});
