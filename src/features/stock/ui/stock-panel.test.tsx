import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { StockPanel } from './stock-panel';

const actions = vi.hoisted(() => ({ fetchItems: vi.fn(), entry: vi.fn() }));

vi.mock('@/features/menu/actions/fetch-menu-items', () => ({ fetchMenuItems: actions.fetchItems }));
vi.mock('@/features/provider/actions/fetch-providers', () => ({ fetchProviders: vi.fn(async () => []) }));
vi.mock('@/features/stock/actions/register-stock-entry', () => ({ registerStockEntryAction: actions.entry }));
vi.mock('@/features/stock/actions/register-stock-loss', () => ({ registerStockLossAction: vi.fn() }));
vi.mock('@/features/stock/actions/fetch-stock-entries', () => ({ fetchStockEntries: vi.fn(async () => []) }));

const ITEM: MenuItemDef = { id: '11111111-1111-4111-8111-111111111111', group: 'empanadas', name: 'Humita', unitCost: null, stock: 5, price1: null, price3: null, price6: null, price12: null, isActive: true, isVisible: false, version: 1, createdAt: '', updatedAt: '' };
const PIZZA: MenuItemDef = { ...ITEM, id: '22222222-2222-4222-8222-222222222222', group: 'pizzas', name: 'Muzza', price1: 11000 };

function as(role: 'admin' | 'vendedor'): void {
  useAuthStore.setState({ user: { id: 'u', username: role, role }, isAuthenticated: true });
}

describe('pantalla de Stock (US-4)', () => {
  beforeEach(() => {
    useMenuStore.setState({ items: [ITEM], groupPrices: [], isLoaded: false });
    actions.fetchItems.mockResolvedValue([ITEM]);
    actions.entry.mockResolvedValue({ success: true, message: 'Stock ingresado: Humita queda con 29', data: { menuItemId: ITEM.id, stock: 29, version: 2 } });
  });

  it('el vendedor ingresa sólo la cantidad: el formulario no le pide costo ni proveedor', async () => {
    as('vendedor');
    render(<StockPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ingresar stock' }));
    expect(screen.queryByLabelText(/Costo/)).toBeNull();
    fireEvent.change(screen.getByLabelText('Gusto o bebida'), { target: { value: ITEM.id } });
    fireEvent.change(screen.getByLabelText('Cantidad que entra'), { target: { value: '24' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    await waitFor(() => expect(actions.entry).toHaveBeenCalledWith({ menuItemId: ITEM.id, quantity: 24 }), { timeout: 5000 });
    expect(await screen.findByText('Stock ingresado: Humita queda con 29')).toBeDefined();
  });

  it('el admin carga cantidad, costo y proveedor', async () => {
    as('admin');
    render(<StockPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ingresar stock' }));
    fireEvent.change(screen.getByLabelText('Gusto o bebida'), { target: { value: ITEM.id } });
    fireEvent.change(screen.getByLabelText('Cantidad que entra'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('Costo para el local, por unidad (vacío = se mantiene el actual)'), { target: { value: '460' } });
    fireEvent.change(screen.getByLabelText('Proveedor (opcional)'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    await waitFor(() => expect(actions.entry).toHaveBeenCalledWith({ menuItemId: ITEM.id, quantity: 12, unitCost: 460, providerId: null }), { timeout: 5000 });
  });

  it('al ingresar una pizza, el costo es el de la pizza entera (BUG-13)', async () => {
    as('admin');
    useMenuStore.setState({ items: [ITEM, PIZZA] });
    actions.fetchItems.mockResolvedValue([ITEM, PIZZA]);
    render(<StockPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ingresar stock' }));
    fireEvent.change(screen.getByLabelText('Gusto o bebida'), { target: { value: PIZZA.id } });
    expect(screen.getByLabelText('Costo para el local, por pizza entera (vacío = se mantiene el actual)')).toBeDefined();
  });

  it('filtra por grupo y por nombre sin romper la pantalla', async () => {
    as('vendedor');
    render(<StockPanel />);
    fireEvent.change(await screen.findByLabelText('Filtrar por grupo'), { target: { value: 'pizzas' } });
    fireEvent.change(screen.getByLabelText('Filtrar por grupo'), { target: { value: 'todos' } });
    expect(screen.getByRole('button', { name: 'Ingresar stock' })).toBeDefined();
  });

  it('no manda el ingreso sin gusto ni cantidad, y muestra los errores', async () => {
    as('vendedor');
    render(<StockPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ingresar stock' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Elegí un gusto o bebida', { selector: 'span' })).toBeDefined();
    expect(actions.entry).not.toHaveBeenCalled();
  });
});
