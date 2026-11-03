import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PromotionDef } from '@/features/promotion/domain/promotion.schema';
import { usePromotionStore } from '@/features/promotion/store/promotion.store';
import { useOrderStore } from '@/features/order/store/order.store';
import { ITEMS, menuItem } from '../testing/board-fixtures';
import { FlavorPicker } from './flavor-picker';
import { PromoCard } from './promo-card';
import { boardModelOf } from './use-order-board';

const promotions = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/features/promotion/actions/fetch-promotions', () => ({ fetchPromotions: promotions.fetch }));

const aquarius = (id: string, flavor: string) => menuItem({ id, group: 'coca_cola', name: `Aquarius 1 L ${flavor}`, drinkName: 'Aquarius', drinkSize: '1 L', flavor, price1: 2000 });
const board = boardModelOf([...ITEMS, aquarius('pera', 'Pera'), aquarius('manzana', 'Manzana')]);
const store = () => useOrderStore.getState();
const fixed = (menuItemId: string, menuItemName: string, drink: { drinkName: string | null; drinkSize: string | null }) => ({ group: 'coca_cola' as const, presentationKey: 'u1', quantity: 1, menuItemId, menuItemName, ...drink });
const promo = (id: string, name: string, component: ReturnType<typeof fixed>): PromotionDef => ({ id, name, price: 9000, isActive: true, version: 1, components: [component], createdAt: '', updatedAt: '' });
const LEGACY = { drinkName: null, drinkSize: null };

describe('bebida fija en Ventas (US-55, US-57)', () => {
  beforeEach(() => {
    store().clear();
    usePromotionStore.setState({ promotions: [], isLoaded: false });
    promotions.fetch.mockResolvedValue([
      promo('p1', 'Con Aquarius', fixed('pera', 'Aquarius 1 L Pera', { drinkName: 'Aquarius', drinkSize: '1 L' })),
      promo('p2', 'Con Coca', fixed('coca', 'Coca-Cola 1,5 L', LEGACY)),
      promo('p3', 'Con Sprite', fixed('sprite', 'Sprite 1 L', { drinkName: 'Sprite', drinkSize: '1 L' })),
    ]);
  });

  it('con varios sabores pide elegir y la lista muestra sólo esa bebida y litros', async () => {
    render(<><PromoCard board={board} /><FlavorPicker board={board} /></>);
    fireEvent.click(await screen.findByRole('button', { name: /Con Aquarius.*Aquarius 1 L/ }));
    const list = within(screen.getByRole('list', { name: 'Gustos' }));
    expect([list.getByText('Aquarius 1 L Pera'), list.getByText('Aquarius 1 L Manzana')]).toHaveLength(2);
    expect(list.queryByText('Coca-Cola 1,5 L')).toBeNull();
  });

  it('con un solo producto a la venta viene puesto; sin ninguno, la promo queda deshabilitada', async () => {
    render(<PromoCard board={board} />);
    fireEvent.click(await screen.findByRole('button', { name: /Con Coca/ }));
    expect([store().promos[0].parts[0].flavors, store().openPromo]).toEqual([[{ menuItemId: 'coca', units: 1 }], null]);
    const sprite = screen.getByRole('button', { name: /Con Sprite/ });
    expect([sprite.getAttribute('title'), sprite.hasAttribute('disabled')]).toEqual(['Sin stock de Sprite 1 L', true]);
  });
});
