import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { checkoutAction } from '@/features/order/actions/checkout';
import { useOrderStore } from '@/features/order/store/order.store';
import { ITEMS } from '../testing/board-fixtures';
import { OrderBoard } from './order-board';

vi.mock('@/features/menu/actions/fetch-menu-items', () => ({ fetchMenuItems: vi.fn(async () => ITEMS) }));
vi.mock('@/features/menu/actions/fetch-ham-price', () => ({ fetchHamPrice: vi.fn(async () => ({ price: 1500, version: 1 })) }));
vi.mock('@/features/order/actions/checkout', () => ({ checkoutAction: vi.fn(async () => ({ success: true, message: 'Venta registrada', data: { saleId: 's1', total: 11500 } })) }));
vi.mock('@/features/card/actions/fetch-cards', () => ({ fetchCards: vi.fn(async () => []) }));

describe('cobrar una pizza con jamón extra (US-47 CA-5)', () => {
  it('manda el jamón al servidor junto con la pizza', async () => {
    useMenuStore.setState({ items: [], isLoaded: false });
    const store = useOrderStore.getState();
    act(() => {
      store.clear();
      store.setBuyer({ name: 'Marta' });
      store.start('pizzas', 'pizza_1');
      store.add('muzza', 'one');
      store.close();
      useOrderStore.getState().toggleHam(useOrderStore.getState().lines[0].id);
    });
    render(<OrderBoard />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ver pedido (1)' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cobrar $11.500' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar $11.500' }));
    await waitFor(() => expect(checkoutAction).toHaveBeenCalledWith(expect.objectContaining({ lines: [{ group: 'pizzas', presentationKey: 'pizza_1', flavors: [{ menuItemId: 'muzza', units: 1 }], quantity: 1, ham: true }] })));
  });
});
