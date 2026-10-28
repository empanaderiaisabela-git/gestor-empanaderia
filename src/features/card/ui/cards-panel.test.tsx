import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CardDef } from '@/features/card/domain/card.schema';
import { useCardStore } from '@/features/card/store/card.store';
import { CardsPanel } from './cards-panel';
import { useCardsPanel } from './use-cards-panel';

const actions = vi.hoisted(() => ({ fetch: vi.fn(), create: vi.fn() }));

vi.mock('@/features/card/actions/fetch-cards', () => ({ fetchCards: actions.fetch }));
vi.mock('@/features/card/actions/create-card', () => ({ createCardAction: actions.create }));
vi.mock('@/features/card/actions/update-card', () => ({ updateCardAction: vi.fn() }));
vi.mock('@/features/card/actions/delete-card', () => ({ deleteCardAction: vi.fn() }));
vi.mock('@/features/card/actions/toggle-card-active', () => ({ toggleCardActiveAction: vi.fn() }));

const VISA: CardDef = { id: 'c1', name: 'Visa', isActive: true, version: 1, plans: [{ installments: 1, surchargePct: 0 }], createdAt: '', updatedAt: '' };

describe('pantalla de Tarjetas (US-10)', () => {
  beforeEach(() => {
    useCardStore.setState({ cards: [], isLoaded: false });
    actions.fetch.mockResolvedValue([VISA, { ...VISA, id: 'c2', name: 'Cabal', isActive: false }]);
    actions.create.mockResolvedValue({ success: true, message: 'Se registró la tarjeta' });
  });

  it('muestra las activas; las inactivas, sólo al pedirlas; y busca por nombre', async () => {
    const { result } = renderHook(() => useCardsPanel());
    await waitFor(() => expect(result.current.initialLoading).toBe(false));
    expect(result.current.visibleCards.map((card) => card.name)).toEqual(['Visa']);
    act(() => result.current.setShowInactive(true));
    act(() => result.current.manager.setSearch('cab'));
    expect(result.current.visibleCards.map((card) => card.name)).toEqual(['Cabal']);
  });

  it('da de alta una tarjeta con dos planes y su recargo (CA-1 y CA-2)', async () => {
    render(<CardsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Nueva tarjeta' }));
    fireEvent.change(screen.getByLabelText('Nombre de la tarjeta'), { target: { value: 'Naranja' } });
    fireEvent.click(screen.getByRole('button', { name: /Agregar plan/ }));
    fireEvent.change(screen.getByLabelText('Recargo % del plan 2'), { target: { value: '12,5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear tarjeta' }));
    const plans = [{ installments: 1, surchargePct: 0 }, { installments: 3, surchargePct: 12.5 }];
    await waitFor(() => expect(actions.create).toHaveBeenCalledWith({ name: 'Naranja', plans }), { timeout: 5000 });
  });

  it('no manda la tarjeta sin nombre y muestra el error', async () => {
    render(<CardsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Nueva tarjeta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear tarjeta' }));
    expect(await screen.findByText('El nombre es obligatorio')).toBeDefined();
    expect(actions.create).not.toHaveBeenCalled();
  });
});
