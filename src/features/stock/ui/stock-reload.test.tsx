import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { useStockPanel } from './use-stock-panel';

const actions = vi.hoisted(() => ({ fetchItems: vi.fn(), register: vi.fn() }));

vi.mock('@/features/menu/actions/fetch-menu-items', () => ({ fetchMenuItems: actions.fetchItems }));
vi.mock('@/features/provider/actions/fetch-providers', () => ({ fetchProviders: vi.fn(async () => []) }));
vi.mock('@/features/stock/actions/register-stock-entry', () => ({ registerStockEntryAction: actions.register }));
vi.mock('@/features/menu/actions/fetch-ham-price', () => ({ fetchHamPrice: vi.fn(async () => ({ price: null, version: 0 })) }));

const CARNE: MenuItemDef = { id: '11111111-1111-4111-8111-111111111111', group: 'empanadas', name: 'Carne', unitCost: 400, stock: 48, price1: 1200, price3: null, price6: null, price12: null, isActive: true, isVisible: false, isBase: false, minStock: null, drinkName: null, liters: null, drinkSize: null, flavor: null, version: 1, createdAt: '', updatedAt: '' };

describe('después de guardar, la grilla ya está al día (US-70)', () => {
  it('el modal se cierra y aparece el aviso recién cuando llegó el stock nuevo', async () => {
    useMenuStore.setState({ items: [CARNE], isLoaded: true });
    let arrive: (items: MenuItemDef[]) => void = () => undefined;
    actions.fetchItems.mockReturnValue(new Promise<MenuItemDef[]>((resolve) => (arrive = resolve)));
    actions.register.mockResolvedValue({ success: true, message: 'Stock ingresado', data: {} });
    const { result } = renderHook(() => useStockPanel());
    act(() => result.current.setDialog({ kind: 'entry', item: CARNE }));
    let saving: Promise<string | null> = Promise.resolve(null);
    act(() => void (saving = result.current.submitEntry({ menuItemId: CARNE.id, quantity: 5 })));
    await waitFor(() => expect(actions.fetchItems).toHaveBeenCalled());
    expect([result.current.dialog?.kind, result.current.message]).toEqual(['entry', null]);
    await act(async () => {
      arrive([{ ...CARNE, stock: 53, version: 2 }]);
      await saving;
    });
    expect([result.current.dialog, result.current.message?.text, result.current.items[0].stock]).toEqual([null, 'Stock ingresado', 53]);
  });
});
