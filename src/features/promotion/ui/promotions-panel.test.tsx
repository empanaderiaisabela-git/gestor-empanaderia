import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { menuItem } from '@/features/order/testing/board-fixtures';
import type { PromotionDef } from '@/features/promotion/domain/promotion.schema';
import { usePromotionStore } from '@/features/promotion/store/promotion.store';
import { PromotionsPanel } from './promotions-panel';
import { usePromotionsPanel } from './use-promotions-panel';

const actions = vi.hoisted(() => ({ fetch: vi.fn(), create: vi.fn(), menu: vi.fn() }));
const SPRITE = '22222222-2222-4222-8222-222222222222';

vi.mock('@/features/menu/actions/fetch-menu-items', () => ({ fetchMenuItems: actions.menu }));

vi.mock('@/features/promotion/actions/fetch-promotions', () => ({ fetchPromotions: actions.fetch }));
vi.mock('@/features/promotion/actions/create-promotion', () => ({ createPromotionAction: actions.create }));
vi.mock('@/features/promotion/actions/update-promotion', () => ({ updatePromotionAction: vi.fn() }));
vi.mock('@/features/promotion/actions/delete-promotion', () => ({ deletePromotionAction: vi.fn() }));
vi.mock('@/features/promotion/actions/toggle-promotion-active', () => ({ togglePromotionActiveAction: vi.fn() }));

const PROMO: PromotionDef = { id: 'p1', name: 'Docena + Coca', price: 15000, isActive: true, version: 1, components: [{ group: 'empanadas', presentationKey: 'u12', quantity: 1, menuItemId: null, menuItemName: null, drinkName: null, drinkSize: null }], createdAt: '', updatedAt: '' };

describe('pantalla de Promociones (US-8)', () => {
  beforeEach(() => {
    usePromotionStore.setState({ promotions: [], isLoaded: false });
    useMenuStore.setState({ items: [], isLoaded: false });
    actions.menu.mockResolvedValue([menuItem({ id: SPRITE, group: 'coca_cola', name: 'Sprite 1.5L' }), menuItem({ id: 'carne', group: 'empanadas', name: 'Carne' })]);
    actions.fetch.mockResolvedValue([PROMO, { ...PROMO, id: 'p2', name: 'Vieja', isActive: false }]);
    actions.create.mockResolvedValue({ success: true, message: 'Se registró la promoción' });
  });

  it('muestra las promos activas; las inactivas, sólo al pedirlas; y busca por nombre', async () => {
    const { result } = renderHook(() => usePromotionsPanel());
    await waitFor(() => expect(result.current.initialLoading).toBe(false));
    expect(result.current.visiblePromotions.map((promotion) => promotion.name)).toEqual(['Docena + Coca']);
    act(() => result.current.setShowInactive(true));
    expect(result.current.visiblePromotions.map((promotion) => promotion.name)).toEqual(['Docena + Coca', 'Vieja']);
    act(() => result.current.manager.setSearch('viej'));
    expect(result.current.visiblePromotions.map((promotion) => promotion.name)).toEqual(['Vieja']);
  });

  it('arma una promo con dos productos, la bebida fija y el precio escrito a mano (CA-1 y CA-2; US-55)', async () => {
    render(<PromotionsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Nueva promoción' }));
    fireEvent.change(screen.getByLabelText('Nombre de la promo'), { target: { value: 'Docena + Coca 1,5' } });
    fireEvent.change(screen.getByLabelText('Presentación del producto 1'), { target: { value: 'u12' } });
    fireEvent.click(screen.getByRole('button', { name: /Agregar producto/ }));
    fireEvent.change(screen.getByLabelText('Grupo del producto 2'), { target: { value: 'coca_cola' } });
    fireEvent.change(await screen.findByRole('combobox', { name: 'Bebida del producto 2' }), { target: { value: SPRITE } });
    fireEvent.change(screen.getByLabelText('Precio de venta de la promo'), { target: { value: '15000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear promoción' }));
    const components = [
      { group: 'empanadas', presentationKey: 'u12', quantity: 1, menuItemId: null },
      { group: 'coca_cola', presentationKey: 'u1', quantity: 1, menuItemId: SPRITE },
    ];
    await waitFor(() => expect(actions.create).toHaveBeenCalledWith({ name: 'Docena + Coca 1,5', price: 15000, components }), { timeout: 5000 });
  });

  it('no manda la promo sin precio y muestra el error en el campo', async () => {
    render(<PromotionsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Nueva promoción' }));
    fireEvent.change(screen.getByLabelText('Nombre de la promo'), { target: { value: 'Sin precio' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear promoción' }));
    expect(await screen.findByText('Ingresá un precio válido')).toBeDefined();
    expect(actions.create).not.toHaveBeenCalled();
  });
});
