import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { StockEntryModal } from './stock-entry-modal';
import type { StockPanelModel } from './use-stock-panel';

const MUZZA: MenuItemDef = { id: '33333333-3333-4333-8333-333333333333', group: 'pizzas', name: 'Muzza', unitCost: 3000, stock: 0, price1: 11000, price3: null, price6: null, price12: null, isActive: true, isVisible: true, isBase: false, minStock: null, version: 4, createdAt: '', updatedAt: '' };
const PREPIZZA: MenuItemDef = { ...MUZZA, id: '44444444-4444-4444-8444-444444444444', name: 'Prepizza', unitCost: null, price1: null, isBase: true };

function renderModal(submitPricing: StockPanelModel['submitPricing']): StockPanelModel['submitEntry'] {
  const submitEntry = vi.fn(async () => null);
  const model: StockPanelModel = { loading: false, items: [], activeItems: [PREPIZZA, MUZZA], providers: [], search: '', setSearch: vi.fn(), categoryFilter: 'todos', setCategoryFilter: vi.fn(), stockOrder: 'categoria', setStockOrder: vi.fn(), dialog: { kind: 'entry', item: null }, setDialog: vi.fn(), message: null, submitEntry, submitLoss: submitEntry, submitPricing, submitEntryUpdate: submitEntry };
  render(<StockEntryModal model={model} />);
  return submitEntry;
}

describe('Ingresar stock: costo y precio de una pizza (BUG-25)', () => {
  it('precarga el costo y el precio del gusto y guarda con "Costo y precio", sin ingresar stock', async () => {
    const submitPricing = vi.fn(async () => null);
    const submitEntry = renderModal(submitPricing);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'pizzas' } });
    fireEvent.change(screen.getByLabelText('Gusto o bebida'), { target: { value: MUZZA.id } });
    expect(screen.getByLabelText('Costo para el local, por pizza entera')).toHaveProperty('value', '3000');
    fireEvent.change(screen.getByLabelText(/Precio de venta/), { target: { value: '12000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(submitPricing).toHaveBeenCalledWith({ menuItemId: MUZZA.id, version: 4, unitCost: 3000, prices: { price1: 12000 }, applyToGroup: false }));
    expect(submitEntry).not.toHaveBeenCalled();
  });

  it('sin gusto no manda nada y lo pide', async () => {
    const submitPricing = vi.fn(async () => null);
    renderModal(submitPricing);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'ciabattas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Elegí un gusto o bebida', { selector: 'span' })).toBeDefined();
    expect(submitPricing).not.toHaveBeenCalled();
  });
});
