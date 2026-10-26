import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PromotionDef } from '@/features/promotion/domain/promotion.schema';
import { usePromotionStore } from '@/features/promotion/store/promotion.store';
import { PromotionsPanel } from './promotions-panel';
import { usePromotionsPanel } from './use-promotions-panel';

const actions = vi.hoisted(() => ({ fetch: vi.fn(), create: vi.fn() }));

vi.mock('@/features/promotion/actions/fetch-promotions', () => ({ fetchPromotions: actions.fetch }));
vi.mock('@/features/promotion/actions/create-promotion', () => ({ createPromotionAction: actions.create }));
vi.mock('@/features/promotion/actions/update-promotion', () => ({ updatePromotionAction: vi.fn() }));
vi.mock('@/features/promotion/actions/delete-promotion', () => ({ deletePromotionAction: vi.fn() }));
vi.mock('@/features/promotion/actions/toggle-promotion-active', () => ({ togglePromotionActiveAction: vi.fn() }));

const PROMO: PromotionDef = { id: 'p1', name: 'Docena + Coca', price: 15000, isActive: true, version: 1, components: [{ group: 'empanadas', presentationKey: 'u12', quantity: 1 }], createdAt: '', updatedAt: '' };

describe('pantalla de Promociones (US-8)', () => {
  beforeEach(() => {
    usePromotionStore.setState({ promotions: [], isLoaded: false });
    actions.fetch.mockResolvedValue([PROMO, { ...PROMO, id: 'p2', name: 'Vieja', isActive: false }]);
    actions.create.mockResolvedValue({ success: true, message: 'Promoción registrado/a exitosamente' });
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

  it('arma una promo con dos productos y el precio escrito a mano (CA-1 y CA-2)', async () => {
    render(<PromotionsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Nueva promoción' }));
    fireEvent.change(screen.getByLabelText('Nombre de la promo'), { target: { value: 'Docena + Coca 1,5' } });
    fireEvent.change(screen.getByLabelText('Presentación del producto 1'), { target: { value: 'u12' } });
    fireEvent.click(screen.getByRole('button', { name: /Agregar producto/ }));
    fireEvent.change(screen.getByLabelText('Grupo del producto 2'), { target: { value: 'coca_cola' } });
    fireEvent.change(screen.getByLabelText('Precio de venta de la promo'), { target: { value: '15000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear promoción' }));
    const components = [
      { group: 'empanadas', presentationKey: 'u12', quantity: 1 },
      { group: 'coca_cola', presentationKey: 'u1', quantity: 1 },
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
