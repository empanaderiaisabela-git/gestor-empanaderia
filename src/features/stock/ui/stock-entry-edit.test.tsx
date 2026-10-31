import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import type { StockEntryDef } from '@/features/stock/domain/stock.schema';
import { StockEntryEditModal } from './stock-entry-edit-modal';
import { StockHistoryModal } from './stock-history-modal';
import type { StockPanelModel } from './use-stock-panel';

const history = vi.hoisted(() => vi.fn());
vi.mock('@/features/stock/actions/fetch-stock-entries', () => ({ fetchStockEntries: history }));

const PROVIDER = { id: '22222222-2222-4222-8222-222222222222', name: 'Molino del Sur', phone: '', email: '', isActive: true, version: 1, createdAt: '', updatedAt: '' };
const CARNE: MenuItemDef = { id: '11111111-1111-4111-8111-111111111111', group: 'empanadas', name: 'Carne', unitCost: 450, stock: 12, price1: 1200, price3: 3400, price6: 6500, price12: 12000, isActive: true, isVisible: false, isBase: false, minStock: 5, version: 3, createdAt: '', updatedAt: '' };
const POLLO: MenuItemDef = { ...CARNE, id: '33333333-3333-4333-8333-333333333333', name: 'Pollo', minStock: null, price1: 1300 };
const ENTRY: StockEntryDef = { id: '44444444-4444-4444-8444-444444444444', menuItemId: CARNE.id, quantity: 12, unitCost: 450, providerId: PROVIDER.id, providerName: 'Molino del Sur', username: 'admin', version: 2, createdAt: '2026-10-30T12:00:00Z' };

function model(overrides: Partial<StockPanelModel>): StockPanelModel {
  const noop = vi.fn(async () => null);
  return { loading: false, items: [], activeItems: [CARNE, POLLO], providers: [PROVIDER], search: '', setSearch: vi.fn(), categoryFilter: 'todos', setCategoryFilter: vi.fn(), stockOrder: 'categoria', setStockOrder: vi.fn(), dialog: null, setDialog: vi.fn(), message: null, submitEntry: noop, submitLoss: noop, submitPricing: noop, submitEntryUpdate: noop, ham: { price: null, version: 0 }, submitHamPrice: noop, ...overrides };
}

describe('editar un ingreso de stock (US-46 CA-2)', () => {
  it('cada ingreso del historial tiene "Editar ingreso", que abre la edición con ese ingreso', async () => {
    history.mockResolvedValue([ENTRY]);
    const setDialog = vi.fn();
    render(<StockHistoryModal model={model({ dialog: { kind: 'history', item: CARNE }, setDialog })} />);
    fireEvent.click(await screen.findByTitle('Editar ingreso'));
    expect(setDialog).toHaveBeenCalledWith({ kind: 'entry', item: CARNE, entry: ENTRY });
  });

  it('abre con todo precargado y guarda con la versión del ingreso', async () => {
    const submitEntryUpdate = vi.fn(async () => null);
    render(<StockEntryEditModal model={model({ submitEntryUpdate })} item={CARNE} entry={ENTRY} />);
    const expected = { Categoría: 'empanadas', 'Gusto o bebida': CARNE.id, 'Cantidad que entra': '12', 'Proveedor (opcional)': PROVIDER.id, 'Stock mínimo (opcional)': '5', 'Precio de venta, 1 unidad': '1200' };
    for (const [label, value] of Object.entries(expected)) expect(screen.getByLabelText(label)).toHaveProperty('value', value);
    fireEvent.change(screen.getByLabelText('Cantidad que entra'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(submitEntryUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: ENTRY.id, version: 2, menuItemId: CARNE.id, quantity: 10, unitCost: 450, providerId: PROVIDER.id, minStock: 5 })));
  });

  it('al cambiar el gusto toma el mínimo del nuevo y no le pasa los precios del viejo', async () => {
    const submitEntryUpdate = vi.fn(async () => null);
    render(<StockEntryEditModal model={model({ submitEntryUpdate })} item={CARNE} entry={ENTRY} />);
    expect(within(screen.getByLabelText('Categoría')).queryByRole('option', { name: 'Pizzas' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Gusto o bebida'), { target: { value: POLLO.id } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(submitEntryUpdate).toHaveBeenCalledWith({ id: ENTRY.id, version: 2, menuItemId: POLLO.id, quantity: 12, unitCost: 450, providerId: PROVIDER.id, minStock: null }));
  });
});
