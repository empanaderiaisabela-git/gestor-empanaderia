import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { checkoutAction } from '@/features/order/actions/checkout';
import { useOrderStore } from '@/features/order/store/order.store';
import { GROUP_PRICES, ITEMS } from '../testing/board-fixtures';
import { OrderBoard } from './order-board';

vi.mock('@/features/menu/actions/fetch-menu-items', () => ({ fetchMenuItems: vi.fn(async () => ITEMS) }));
vi.mock('@/features/menu/actions/fetch-menu-group-prices', () => ({ fetchMenuGroupPrices: vi.fn(async () => GROUP_PRICES) }));
vi.mock('@/features/order/actions/checkout', () => ({ checkoutAction: vi.fn() }));

const store = () => useOrderStore.getState();
const PIZZA = { group: 'pizzas', presentationKey: 'pizza_2', flavors: [{ menuItemId: 'muzza', units: 0.5 }, { menuItemId: 'napo', units: 0.5 }], quantity: 1 };
const COCA = { group: 'coca_cola', presentationKey: 'u1', flavors: [{ menuItemId: 'coca', units: 1 }], quantity: 1 };

async function openCheckout(): Promise<void> {
  act(() => {
    store().start('pizzas', 'pizza_2');
    store().add('muzza', 'one');
    store().add('napo', 'one');
    store().start('coca_cola', 'u1');
    store().add('coca', 'one');
    store().close();
  });
  render(<OrderBoard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Cobrar $15.500' }));
}

describe('cobrar desde el tablero (US-6 CA-1 y CA-5)', () => {
  beforeEach(() => {
    useMenuStore.setState({ items: [], groupPrices: [], isLoaded: false });
    store().clear();
    vi.mocked(checkoutAction).mockReset();
  });

  it('cobra con dos medios: el segundo se lleva el resto y el pedido se vacía', async () => {
    vi.mocked(checkoutAction).mockResolvedValue({ success: true, message: 'Venta registrada por $15.500', data: { saleId: 's1', total: 15500 } });
    await openCheckout();
    fireEvent.click(screen.getByRole('button', { name: 'Débito' }));
    fireEvent.change(screen.getByLabelText('Monto en Efectivo'), { target: { value: '10000' } });
    expect(screen.getByText('Resto en Débito: $5.500')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar $15.500' }));

    expect(await screen.findByText('Venta registrada por $15.500')).toBeDefined();
    expect(checkoutAction).toHaveBeenCalledWith({
      buyerName: '',
      lines: [PIZZA, COCA],
      discountPercentage: 0,
      discountAmount: 0,
      payments: [{ type: 'efectivo', amount: 10000 }, { type: 'debito', amount: 5500 }],
    });
    expect(store().lines).toEqual([]);
  });

  it('si el servidor rechaza, muestra el motivo y el pedido queda como estaba', async () => {
    vi.mocked(checkoutAction).mockResolvedValue({ success: false, code: 'INSUFFICIENT_STOCK', error: 'No hay stock suficiente de Muzza.' });
    await openCheckout();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar $15.500' }));
    expect(await screen.findByText('No hay stock suficiente de Muzza.')).toBeDefined();
    expect(store().lines).toHaveLength(2);
  });

  it('un descuento del 100 % avisa y no llega al servidor', async () => {
    await openCheckout();
    fireEvent.change(screen.getByLabelText('Descuento %'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar $0' }));
    expect(await screen.findByText('El descuento no puede dejar el total en $0')).toBeDefined();
    expect(checkoutAction).not.toHaveBeenCalled();
  });

  it('con un descuento en $, el total baja y se muestra el comprador', async () => {
    act(() => store().setBuyerName('Marta'));
    await openCheckout();
    fireEvent.change(screen.getByLabelText('Descuento $'), { target: { value: '500' } });
    expect(screen.getByText('Comprador: Marta · Subtotal $15.500')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Confirmar $15.000' })).toBeDefined();
  });
});
