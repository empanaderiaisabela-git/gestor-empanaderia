import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { useMenuPanel } from './use-menu-panel';

const actions = vi.hoisted(() => ({ fetch: vi.fn(), toggle: vi.fn(), remove: vi.fn() }));

vi.mock('@/features/menu/actions/fetch-menu-items', () => ({ fetchMenuItems: actions.fetch }));
vi.mock('@/features/menu/actions/fetch-menu-group-prices', () => ({ fetchMenuGroupPrices: vi.fn(async () => []) }));
vi.mock('@/features/menu/actions/toggle-menu-item-active', () => ({ toggleMenuItemActiveAction: actions.toggle }));
vi.mock('@/features/menu/actions/delete-menu-item', () => ({ deleteMenuItemAction: actions.remove }));
vi.mock('@/features/menu/actions/create-menu-item', () => ({ createMenuItemAction: vi.fn() }));
vi.mock('@/features/menu/actions/update-menu-item', () => ({ updateMenuItemAction: vi.fn() }));
vi.mock('@/features/menu/actions/save-menu-group-prices', () => ({ saveMenuGroupPricesAction: vi.fn() }));

const item = (overrides: Partial<MenuItemDef>): MenuItemDef => ({ id: 'a', group: 'empanadas', name: 'Carne', unitCost: 1, stock: 0, price1: null, price3: null, price6: null, price12: null, isActive: true, version: 4, createdAt: '', updatedAt: '', ...overrides });
const ITEMS = [item({}), item({ id: 'b', group: 'pizzas', name: 'Muzza', price1: 10 }), item({ id: 'c', name: 'Humita', isActive: false })];

describe('useMenuPanel', () => {
  beforeEach(() => {
    useMenuStore.setState({ items: ITEMS, groupPrices: [], isLoaded: true });
    actions.fetch.mockResolvedValue(ITEMS);
    actions.toggle.mockResolvedValue({ success: true, message: 'ok' });
    actions.remove.mockResolvedValue({ success: true, message: 'ok' });
  });

  it('oculta los inactivos y filtra por grupo y por nombre', () => {
    const { result } = renderHook(() => useMenuPanel());
    expect(result.current.visibleItems.map((row) => row.name)).toEqual(['Carne', 'Muzza']);
    act(() => result.current.setGroupFilter('pizzas'));
    expect(result.current.visibleItems.map((row) => row.name)).toEqual(['Muzza']);
    act(() => {
      result.current.setGroupFilter('todos');
      result.current.setShowInactive(true);
      result.current.manager.setSearch('humi');
    });
    expect(result.current.visibleItems.map((row) => row.name)).toEqual(['Humita']);
  });

  it('desactivar y borrar mandan la versión que tiene la grilla', async () => {
    const { result } = renderHook(() => useMenuPanel());
    act(() => result.current.actions.handleToggleActive(ITEMS[0]));
    await waitFor(() => expect(actions.toggle).toHaveBeenCalledWith({ id: 'a', isActive: false, version: 4 }));
    act(() => result.current.actions.handleDelete('b'));
    await waitFor(() => expect(actions.remove).toHaveBeenCalledWith({ id: 'b', version: 4 }));
  });

  it('sincronizar vuelve a pedir la lista', async () => {
    const { result } = renderHook(() => useMenuPanel());
    act(() => {
      void result.current.actions.syncData(true);
    });
    await waitFor(() => expect(actions.fetch).toHaveBeenCalled());
  });
});
