import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { StockPanel } from './stock-panel';

const actions = vi.hoisted(() => ({ fetchItems: vi.fn(), entry: vi.fn() }));

vi.mock('@/features/menu/actions/fetch-menu-items', () => ({ fetchMenuItems: actions.fetchItems }));
vi.mock('@/features/provider/actions/fetch-providers', () => ({ fetchProviders: vi.fn(async () => []) }));
vi.mock('@/features/stock/actions/register-stock-entry', () => ({ registerStockEntryAction: actions.entry }));
vi.mock('@/features/stock/actions/register-stock-loss', () => ({ registerStockLossAction: vi.fn() }));
vi.mock('@/features/stock/actions/set-stock-pricing', () => ({ setStockPricingAction: vi.fn() }));
vi.mock('@/features/stock/actions/fetch-stock-entries', () => ({ fetchStockEntries: vi.fn(async () => []) }));

const ITEM: MenuItemDef = { id: '11111111-1111-4111-8111-111111111111', group: 'empanadas', name: 'Humita', unitCost: null, stock: 5, price1: null, price3: null, price6: null, price12: null, isActive: true, isVisible: false, isBase: false, version: 1, createdAt: '', updatedAt: '' };
const COCA: MenuItemDef = { ...ITEM, id: '22222222-2222-4222-8222-222222222222', group: 'coca_cola', name: 'Coca 500', price1: 3500 };
const MUZZA: MenuItemDef = { ...ITEM, id: '33333333-3333-4333-8333-333333333333', group: 'pizzas', name: 'Muzza', stock: 0, price1: 11000 };
const PREPIZZA: MenuItemDef = { ...ITEM, id: '44444444-4444-4444-8444-444444444444', group: 'pizzas', name: 'Prepizza', stock: 0, isBase: true };

describe('pantalla de Stock (US-4)', () => {
  beforeEach(() => {
    useMenuStore.setState({ items: [ITEM], isLoaded: false });
    actions.fetchItems.mockResolvedValue([ITEM]);
    actions.entry.mockResolvedValue({ success: true, message: 'Stock ingresado: Humita queda con 29', data: { menuItemId: ITEM.id, stock: 29, version: 2 } });
  });

  it('el admin carga cantidad, costo y proveedor', async () => {
    render(<StockPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ingresar stock' }));
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: ITEM.group } });
    fireEvent.change(screen.getByLabelText('Gusto o bebida'), { target: { value: ITEM.id } });
    fireEvent.change(screen.getByLabelText('Cantidad que entra'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('Costo para el local, por unidad'), { target: { value: '460' } });
    fireEvent.change(screen.getByLabelText('Proveedor (opcional)'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    await waitFor(() => expect(actions.entry).toHaveBeenCalledWith({ menuItemId: ITEM.id, quantity: 12, unitCost: 460, providerId: null }), { timeout: 5000 });
  });

  it('en Pizzas, Ingresar stock ofrece sólo la Prepizza y pide la cantidad, sin costo ni precio (US-29 CA-2)', async () => {
    useMenuStore.setState({ items: [ITEM, PREPIZZA, MUZZA] });
    actions.fetchItems.mockResolvedValue([ITEM, PREPIZZA, MUZZA]);
    render(<StockPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ingresar stock' }));
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'pizzas' } });
    expect(screen.queryByRole('option', { name: /Muzza/ })).toBeNull();
    fireEvent.change(screen.getByLabelText('Gusto o bebida'), { target: { value: PREPIZZA.id } });
    expect(screen.queryByLabelText(/Costo para el local/)).toBeNull();
    fireEvent.change(screen.getByLabelText('Cantidad que entra'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    await waitFor(() => expect(actions.entry).toHaveBeenCalledWith({ menuItemId: PREPIZZA.id, quantity: 2, providerId: null }));
  });

  it('el admin carga el precio de venta y el servidor puede rechazar el ingreso', async () => {
    useMenuStore.setState({ items: [COCA] });
    actions.fetchItems.mockResolvedValue([COCA]);
    actions.entry.mockResolvedValue({ success: false, error: 'Falta el costo para el local.' });
    render(<StockPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ingresar stock' }));
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: COCA.group } });
    fireEvent.change(screen.getByLabelText('Gusto o bebida'), { target: { value: COCA.id } });
    fireEvent.change(screen.getByLabelText('Cantidad que entra'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Precio de venta, 1 unidad'), { target: { value: '4000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    await waitFor(() => expect(actions.entry).toHaveBeenCalledWith({ menuItemId: COCA.id, quantity: 5, providerId: null, prices: { price1: 4000 } }));
    expect(await screen.findByText('Falta el costo para el local.')).toBeDefined();
  });

  it('filtra por grupo y por nombre sin romper la pantalla', async () => {
    render(<StockPanel />);
    fireEvent.change(await screen.findByLabelText('Filtrar por grupo'), { target: { value: 'pizzas' } });
    fireEvent.change(screen.getByLabelText('Filtrar por grupo'), { target: { value: 'todos' } });
    expect(screen.getByRole('button', { name: 'Ingresar stock' })).toBeDefined();
  });

  it('no manda el ingreso sin gusto ni cantidad, y muestra los errores', async () => {
    render(<StockPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ingresar stock' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Elegí un gusto o bebida', { selector: 'span' })).toBeDefined();
    expect(actions.entry).not.toHaveBeenCalled();
  });
});
