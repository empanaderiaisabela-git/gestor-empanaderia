import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StockEntryModal } from './stock-entry-modal';
import type { StockPanelModel } from './use-stock-panel';

function model(overrides: Partial<StockPanelModel>): StockPanelModel {
  const noop = vi.fn(async () => null);
  const base: StockPanelModel = { loading: false, items: [], activeItems: [], providers: [], search: '', setSearch: vi.fn(), categoryFilter: 'todos', setCategoryFilter: vi.fn(), stockOrder: 'categoria', setStockOrder: vi.fn(), dialog: { kind: 'entry', item: null }, setDialog: vi.fn(), message: null, submitEntry: noop, submitLoss: noop, submitPricing: noop, submitEntryUpdate: noop, ham: { price: 1500, version: 2 }, submitHamPrice: noop };
  return { ...base, ...overrides };
}

describe('Ingresar stock: Jamón extra para pizza (US-47 CA-2)', () => {
  it('la categoría pide sólo el precio de venta, precargado, y guarda con la versión leída', async () => {
    const submitHamPrice = vi.fn(async () => null);
    render(<StockEntryModal model={model({ submitHamPrice })} />);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'jamon_extra' } });
    expect(screen.getByLabelText('Precio de venta')).toHaveProperty('value', '1500');
    expect([screen.queryByLabelText('Gusto o bebida'), screen.queryByLabelText('Cantidad que entra'), screen.queryByLabelText('Proveedor (opcional)')]).toEqual([null, null, null]);
    fireEvent.change(screen.getByLabelText('Precio de venta'), { target: { value: '1800' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(submitHamPrice).toHaveBeenCalledWith({ price: 1800, version: 2 }));
  });

  it('un precio vacío o en 0 marca el error y no se manda', async () => {
    const submitHamPrice = vi.fn(async () => null);
    render(<StockEntryModal model={model({ submitHamPrice, ham: { price: null, version: 0 } })} />);
    expect(within(screen.getByLabelText('Categoría')).getByRole('option', { name: 'Jamón extra para pizza' })).toBeDefined();
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'jamon_extra' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Ingresá un precio válido')).toBeDefined();
    expect(submitHamPrice).not.toHaveBeenCalled();
  });
});
