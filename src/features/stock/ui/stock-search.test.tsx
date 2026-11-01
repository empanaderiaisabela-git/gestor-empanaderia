import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { useStockPanel } from './use-stock-panel';

const actions = vi.hoisted(() => ({ fetchItems: vi.fn() }));

vi.mock('@/features/menu/actions/fetch-menu-items', () => ({ fetchMenuItems: actions.fetchItems }));
vi.mock('@/features/provider/actions/fetch-providers', () => ({ fetchProviders: vi.fn(async () => []) }));
vi.mock('@/features/stock/actions/register-stock-entry', () => ({ registerStockEntryAction: vi.fn() }));
vi.mock('@/features/stock/actions/register-stock-loss', () => ({ registerStockLossAction: vi.fn() }));
vi.mock('@/features/stock/actions/set-stock-pricing', () => ({ setStockPricingAction: vi.fn() }));
vi.mock('@/features/stock/actions/fetch-stock-entries', () => ({ fetchStockEntries: vi.fn(async () => []) }));
vi.mock('@/features/menu/actions/fetch-ham-price', () => ({ fetchHamPrice: vi.fn(async () => ({ price: null, version: 0 })) }));

const BASE: MenuItemDef = { id: '11111111-1111-4111-8111-111111111111', group: 'empanadas', name: 'Empanada de carne', unitCost: null, stock: 5, price1: null, price3: null, price6: null, price12: null, isActive: true, isVisible: false, isBase: false, minStock: null, drinkName: null, liters: null, drinkSize: null, flavor: null, version: 1, createdAt: '', updatedAt: '' };
const POLLO: MenuItemDef = { ...BASE, id: '22222222-2222-4222-8222-222222222222', name: 'Empanada de pollo' };

describe('buscador de Stock (US-52)', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: 'u', username: 'admin', role: 'admin' }, isAuthenticated: true });
    useMenuStore.setState({ items: [BASE, POLLO], isLoaded: false });
    actions.fetchItems.mockResolvedValue([BASE, POLLO]);
  });

  it.each(['empanada carne', 'carne empanada', 'EMPANÁDA   CAR'])('"%s" encuentra "Empanada de carne" y deja afuera la de pollo', async (search) => {
    const { result } = renderHook(() => useStockPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setSearch(search));
    expect(result.current.items.map((item) => item.name)).toEqual(['Empanada de carne']);
  });

  it('una palabra que no está deja la lista vacía', async () => {
    const { result } = renderHook(() => useStockPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setSearch('empanada humita'));
    expect(result.current.items).toEqual([]);
  });
});
