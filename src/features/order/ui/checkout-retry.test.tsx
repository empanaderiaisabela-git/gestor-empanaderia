import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { checkoutAction } from '@/features/order/actions/checkout';
import { useOrderStore } from '@/features/order/store/order.store';
import { ITEMS } from '../testing/board-fixtures';
import { OrderBoard } from './order-board';

vi.mock('@/features/menu/actions/fetch-menu-items', () => ({ fetchMenuItems: vi.fn(async () => ITEMS) }));
vi.mock('@/features/order/actions/checkout', () => ({ checkoutAction: vi.fn() }));
vi.mock('@/features/card/actions/fetch-cards', () => ({ fetchCards: vi.fn(async () => []) }));

const store = () => useOrderStore.getState();
const confirmButton = (): HTMLElement => screen.getByRole('button', { name: 'Confirmar $3.500' });

async function openCheckout(): Promise<void> {
  act(() => {
    store().start('coca_cola', 'u1');
    store().add('coca', 'one');
    store().close();
  });
  render(<OrderBoard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Ver pedido (1)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cobrar $3.500' }));
  fireEvent.click(screen.getByRole('button', { name: 'Efectivo' }));
}

describe('reintentar el cobro (BUG-33)', () => {
  beforeEach(() => {
    useMenuStore.setState({ items: [], isLoaded: false });
    store().clear();
    store().setBuyer({ name: 'Jessica' });
    vi.mocked(checkoutAction).mockReset();
  });

  it('si la llamada falla, avisa, deja el pedido y el botón vuelve a andar (CA-3)', async () => {
    vi.mocked(checkoutAction).mockRejectedValueOnce(new Error('Failed to fetch'));
    await openCheckout();
    fireEvent.click(confirmButton());
    expect(await screen.findByText('No se pudo confirmar. Reintentá.')).toBeDefined();
    expect(confirmButton().hasAttribute('disabled')).toBe(false);
    expect(store().lines).toHaveLength(1);
  });

  it('el reintento manda la misma clave de cobro (CA-1)', async () => {
    const key = store().checkoutKey;
    vi.mocked(checkoutAction).mockRejectedValueOnce(new Error('Failed to fetch')).mockResolvedValueOnce({ success: true, message: 'Venta registrada por $3.500', data: { saleId: 's1', total: 3500 } });
    await openCheckout();
    fireEvent.click(confirmButton());
    await screen.findByText('No se pudo confirmar. Reintentá.');
    fireEvent.click(confirmButton());
    expect(await screen.findByText('Venta registrada por $3.500')).toBeDefined();
    await waitFor(() => expect(vi.mocked(checkoutAction).mock.calls.map(([input]) => input.checkoutKey)).toEqual([key, key]));
  });
});
