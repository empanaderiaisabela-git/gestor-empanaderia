import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { StockEntryModal } from './stock-entry-modal';
import { StockPricingModal } from './stock-pricing-modal';
import type { StockPanelModel } from './use-stock-panel';

const entries = vi.hoisted(() => vi.fn(async () => [{ id: 'e', menuItemId: '11111111-1111-4111-8111-111111111111', quantity: 6, unitCost: 900, providerId: '22222222-2222-4222-8222-222222222222', providerName: 'Bebidas Norte', username: 'admin', version: 1, createdAt: '2026-10-31T12:00:00Z' }]));
vi.mock('@/features/stock/actions/fetch-stock-entries', () => ({ fetchStockEntries: entries }));

const drink = (id: string, flavor: string | null, extra: Partial<MenuItemDef> = {}): MenuItemDef => ({ id, group: 'coca_cola', name: `Aquarius 1.5 L ${flavor ?? ''}`.trim(), unitCost: null, stock: 0, price1: null, price3: null, price6: null, price12: null, isActive: true, isVisible: false, isBase: false, minStock: null, drinkName: 'Aquarius', liters: 1.5, flavor, version: 1, createdAt: '', updatedAt: '', ...extra });
const MANZANA = drink('11111111-1111-4111-8111-111111111111', 'Manzana', { unitCost: 900, price1: 2500, stock: 6 });
const PERA = drink('33333333-3333-4333-8333-333333333333', 'Pera');
const LEGACY = drink('44444444-4444-4444-8444-444444444444', null, { name: 'Sprite 1,5 L', drinkName: null, liters: null, price1: 3200 });
const PROVIDER = { id: '22222222-2222-4222-8222-222222222222', name: 'Bebidas Norte', phone: '', email: '', isActive: true, version: 1, createdAt: '', updatedAt: '' };

function model(overrides: Partial<StockPanelModel>): StockPanelModel {
  const noop = vi.fn(async () => null);
  const base: StockPanelModel = { loading: false, items: [], activeItems: [MANZANA, PERA, LEGACY], providers: [PROVIDER], search: '', setSearch: vi.fn(), categoryFilter: 'todos', setCategoryFilter: vi.fn(), stockOrder: 'categoria', setStockOrder: vi.fn(), dialog: { kind: 'entry', item: null }, setDialog: vi.fn(), message: null, submitEntry: noop, submitLoss: noop, submitPricing: noop, submitEntryUpdate: noop, ham: { price: null, version: 0 }, submitHamPrice: noop };
  return { ...base, ...overrides };
}

describe('Ingresar stock de bebidas: Bebida, Litros y Sabor (US-49 CA-3)', () => {
  it('el segundo sabor trae costo, precio y proveedor de su familia y sólo pide la cantidad', async () => {
    const submitEntry = vi.fn(async () => null);
    render(<StockEntryModal model={model({ submitEntry })} />);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'coca_cola' } });
    fireEvent.change(screen.getByLabelText('Bebida'), { target: { value: 'aquarius' } });
    fireEvent.change(screen.getByLabelText('Litros'), { target: { value: '1.5' } });
    fireEvent.change(screen.getByLabelText('Sabor'), { target: { value: PERA.id } });
    expect(screen.getByLabelText('Costo para el local, por unidad')).toHaveProperty('value', '900');
    expect(screen.getByLabelText('Precio de venta, 1 unidad')).toHaveProperty('value', '2500');
    await waitFor(() => expect(screen.getByLabelText('Proveedor (opcional)')).toHaveProperty('value', PROVIDER.id));
    fireEvent.change(screen.getByLabelText('Cantidad que entra'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    await waitFor(() => expect(submitEntry).toHaveBeenCalledWith({ menuItemId: PERA.id, quantity: 4, unitCost: 900, prices: { price1: 2500 }, providerId: PROVIDER.id, minStock: null }));
  });

  it('una bebida vieja sin bebida ni litros se elige directo en Bebida', () => {
    render(<StockEntryModal model={model({})} />);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'coca_cola' } });
    fireEvent.change(screen.getByLabelText('Bebida'), { target: { value: `legacy:${LEGACY.id}` } });
    expect(screen.queryByLabelText('Litros')).toBeNull();
    expect(screen.getByLabelText('Precio de venta, 1 unidad')).toHaveProperty('value', '3200');
  });
});

describe('"Costo y precio" de una bebida con familia (US-49 CA-4)', () => {
  it('avisa que se aplica a todos los sabores, sin la casilla', () => {
    render(<StockPricingModal model={model({ dialog: { kind: 'pricing', item: MANZANA } })} />);
    expect(screen.getByText('Se aplica a los 2 sabores')).toBeDefined();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
});
