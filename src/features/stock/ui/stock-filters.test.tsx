import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StockFilters } from './stock-filters';
import type { StockPanelModel } from './use-stock-panel';

function renderFilters(setStockOrder = vi.fn()): typeof setStockOrder {
  const noop = vi.fn(async () => null);
  const model: StockPanelModel = { loading: false, items: [], activeItems: [], providers: [], search: '', setSearch: vi.fn(), categoryFilter: 'todos', setCategoryFilter: vi.fn(), stockOrder: 'categoria', setStockOrder, dialog: null, setDialog: vi.fn(), message: null, submitEntry: noop, submitLoss: noop, submitPricing: noop, submitEntryUpdate: noop };
  render(<div data-testid='filtros'><StockFilters model={model} isAdmin /></div>);
  return setStockOrder;
}

describe('desplegable de orden de Stock (US-34)', () => {
  it('va a la izquierda de las categorías, con las cinco opciones', () => {
    renderFilters();
    expect(within(screen.getByTestId('filtros')).getAllByRole('combobox').map((select) => select.getAttribute('aria-label'))).toEqual(['Ordenar Stock', 'Filtrar Stock']);
    expect(within(screen.getByLabelText('Ordenar Stock')).getAllByRole('option').map((option) => option.textContent)).toEqual(['Orden por categoría', 'Stock creciente', 'Stock decreciente', 'Solo sin stock', 'Quitar sin stock']);
  });

  it('elegir una opción cambia el orden', () => {
    const setStockOrder = renderFilters();
    fireEvent.change(screen.getByLabelText('Ordenar Stock'), { target: { value: 'sin_stock' } });
    expect(setStockOrder).toHaveBeenCalledWith('sin_stock');
  });
});
