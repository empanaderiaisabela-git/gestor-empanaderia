import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import type { StockEntryDef } from '@/features/stock/domain/stock.schema';
import { StockEntryEditModal } from './stock-entry-edit-modal';
import { StockHistoryModal } from './stock-history-modal';
import type { StockPanelModel } from './use-stock-panel';

const history = vi.hoisted(() => vi.fn());
vi.mock('@/features/stock/actions/fetch-stock-entries', () => ({ fetchStockEntries: history }));

const PROVIDER = { id: '22222222-2222-4222-8222-222222222222', name: 'Molino del Sur', phone: '', email: '', isActive: true, version: 1, createdAt: '', updatedAt: '' };
const CARNE: MenuItemDef = { id: '11111111-1111-4111-8111-111111111111', group: 'empanadas', name: 'Carne', unitCost: 450, stock: 17, price1: 1200, price3: 3400, price6: 6500, price12: 12000, isActive: true, isVisible: false, isBase: false, minStock: 5, drinkName: null, liters: null, drinkSize: null, flavor: null, version: 3, createdAt: '', updatedAt: '' };
const ENTRY: StockEntryDef = { id: '44444444-4444-4444-8444-444444444444', menuItemId: CARNE.id, quantity: 40, unitCost: 450, providerId: PROVIDER.id, providerName: 'Molino del Sur', username: 'admin', version: 2, createdAt: '2026-10-30T12:00:00Z' };

function model(overrides: Partial<StockPanelModel>): StockPanelModel {
  const noop = vi.fn(async () => null);
  return { loading: false, items: [], activeItems: [CARNE], providers: [PROVIDER], search: '', setSearch: vi.fn(), categoryFilter: 'todos', setCategoryFilter: vi.fn(), stockOrder: 'categoria', setStockOrder: vi.fn(), dialog: null, setDialog: vi.fn(), message: null, submitEntry: noop, submitLoss: noop, submitPricing: noop, submitOverwrite: noop, ham: { price: null, version: 0 }, submitHamPrice: noop, submitIncrease: noop, ...overrides };
}

const save = (): void => void fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

describe('editar el stock con el lápiz (US-70)', () => {
  it('"Editar ingreso" del historial abre la misma edición con ese ingreso (D-3)', async () => {
    history.mockResolvedValue([ENTRY]);
    const setDialog = vi.fn();
    render(<StockHistoryModal model={model({ dialog: { kind: 'history', item: CARNE }, setDialog })} />);
    fireEvent.click(await screen.findByTitle('Editar ingreso'));
    expect(setDialog).toHaveBeenCalledWith({ kind: 'edit', item: CARNE, entry: ENTRY });
  });

  it('"Stock" arranca con el de la grilla, no con el ingreso, y guarda el número escrito (CA-1)', async () => {
    const submitOverwrite = vi.fn(async () => null);
    render(<StockEntryEditModal model={model({ submitOverwrite })} item={CARNE} entry={ENTRY} />);
    const expected = { Stock: '17', 'Proveedor (opcional)': PROVIDER.id, 'Stock mínimo (opcional)': '5', 'Precio de venta, 1 unidad': '1200' };
    for (const [label, value] of Object.entries(expected)) expect(screen.getByLabelText(label)).toHaveProperty('value', value);
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '15' } });
    save();
    await waitFor(() => expect(submitOverwrite).toHaveBeenCalledWith(expect.objectContaining({ menuItemId: CARNE.id, itemVersion: 3, stock: 15, unitCost: 450, providerId: PROVIDER.id, minStock: 5, entry: { id: ENTRY.id, version: 2 } })));
  });

  it('la categoría y el gusto se ven pero no se cambian (D-5)', () => {
    render(<StockEntryEditModal model={model({})} item={CARNE} entry={ENTRY} />);
    expect(screen.queryByLabelText('Categoría')).toBeNull();
    expect(screen.queryByLabelText('Gusto o bebida')).toBeNull();
    expect(screen.getByText('Empanadas · Carne')).toBeDefined();
  });

  it('sin ingreso no pide proveedor y guarda sin ingreso (CA-3)', async () => {
    const submitOverwrite = vi.fn(async () => null);
    render(<StockEntryEditModal model={model({ submitOverwrite })} item={CARNE} entry={null} />);
    expect(screen.queryByLabelText('Proveedor (opcional)')).toBeNull();
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '0' } });
    save();
    await waitFor(() => expect(submitOverwrite).toHaveBeenCalledWith(expect.objectContaining({ stock: 0, providerId: null, entry: null })));
  });

  it('un stock negativo muestra su error y no se envía', async () => {
    const submitOverwrite = vi.fn(async () => null);
    render(<StockEntryEditModal model={model({ submitOverwrite })} item={CARNE} entry={ENTRY} />);
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '-1' } });
    save();
    expect(await screen.findByText('El stock no puede ser negativo')).toBeDefined();
    expect(submitOverwrite).not.toHaveBeenCalled();
  });
});
