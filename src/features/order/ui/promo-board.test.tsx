import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PromotionDef } from '@/features/promotion/domain/promotion.schema';
import { usePromotionStore } from '@/features/promotion/store/promotion.store';
import { useOrderStore } from '@/features/order/store/order.store';
import { ITEMS } from '../testing/board-fixtures';
import { CurrentOrder } from './current-order';
import { FlavorPicker } from './flavor-picker';
import { PromoCard } from './promo-card';
import { boardModelOf } from './use-order-board';

const promotions = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/features/promotion/actions/fetch-promotions', () => ({ fetchPromotions: promotions.fetch }));

const board = boardModelOf(ITEMS);
const store = () => useOrderStore.getState();
const promo = (overrides: Partial<PromotionDef>): PromotionDef => ({ id: 'p1', name: 'Media + Coca', price: 9000, isActive: true, version: 1, components: [], createdAt: '', updatedAt: '', ...overrides });
const MEDIA_Y_COCA = promo({ components: [{ group: 'empanadas', presentationKey: 'u6', quantity: 1 }, { group: 'coca_cola', presentationKey: 'u1', quantity: 1 }] });
const rowOf = (name: string): HTMLElement => screen.getByText(name).closest('li') ?? document.body;

describe('promos en el tablero (US-9 CA-1 y CA-2)', () => {
  beforeEach(() => {
    store().clear();
    usePromotionStore.setState({ promotions: [], isLoaded: false });
    promotions.fetch.mockResolvedValue([MEDIA_Y_COCA, promo({ id: 'p2', name: 'Vieja', isActive: false }), promo({ id: 'p3', name: 'Ciabatta', components: [{ group: 'ciabattas', presentationKey: 'u1', quantity: 1 }] })]);
  });

  it('la subdivisión Promos muestra las activas con su precio; una con productos sin gustos queda deshabilitada', async () => {
    render(<PromoCard board={board} />);
    const media = await screen.findByRole('button', { name: /Media \+ Coca/ });
    expect(within(media).getByText('$9.000')).toBeDefined();
    expect(screen.queryByText('Vieja')).toBeNull();
    expect(screen.getByRole('button', { name: /Ciabatta/ }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(media);
    expect(store().promos.map((line) => line.name)).toEqual(['Media + Coca']);
  });

  it('sin promos activas lo avisa', async () => {
    promotions.fetch.mockResolvedValue([]);
    render(<PromoCard board={board} />);
    expect(await screen.findByText('Todavía no hay promos activas')).toBeDefined();
  });

  it('pide los gustos de cada producto de la promo, sin precio propio; "Siguiente" pasa al otro y "Listo" cierra (US-39)', async () => {
    act(() => store().startPromo(MEDIA_Y_COCA));
    render(<FlavorPicker board={board} />);
    expect(['Media + Coca', 'Empanadas · ½ docena', '(1 de 2)'].every((text) => screen.getByText(text))).toBe(true);
    expect(within(rowOf('Carne')).getByText('En la promo · stock 50')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Siguiente' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(within(rowOf('Carne')).getByRole('button', { name: 'Completar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(screen.getByText('(2 de 2)')).toBeDefined());
    expect(screen.getByText('Coca-Cola · 1 unidad')).toBeDefined();
    fireEvent.click(within(rowOf('Coca-Cola 1,5 L')).getByRole('button', { name: 'Agregar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    expect(store().openPromo).toBeNull();
  });

  it('en el pedido, la promo suma su precio y bloquea el cobro hasta tener todos los gustos', () => {
    act(() => {
      store().startPromo(MEDIA_Y_COCA);
      store().addToOpenPromo('carne', 'rest');
      store().close();
    });
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    expect(screen.getByText('Promo · Media + Coca')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cobrar $9.000' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'faltan gustos · elegir' }));
    expect(store().openPromo).toMatchObject({ part: 1 });
    act(() => {
      store().addToOpenPromo('coca', 'one');
    });
    expect(screen.getByRole('button', { name: 'Cobrar $9.000' }).hasAttribute('disabled')).toBe(false);
    fireEvent.click(screen.getByTitle('Quitar del pedido'));
    expect(store().promos).toEqual([]);
  });
});
