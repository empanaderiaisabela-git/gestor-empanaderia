import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { useOrderStore } from '@/features/order/store/order.store';
import { GROUP_PRICES, ITEMS } from '../testing/board-fixtures';
import { OrderBoard } from './order-board';

vi.mock('@/features/menu/actions/fetch-menu-items', () => ({ fetchMenuItems: vi.fn(async () => ITEMS) }));
vi.mock('@/features/menu/actions/fetch-menu-group-prices', () => ({ fetchMenuGroupPrices: vi.fn(async () => GROUP_PRICES) }));

describe('tablero de ventas (US-5 CA-1)', () => {
  beforeEach(() => {
    useMenuStore.setState({ items: [], groupPrices: [], isLoaded: false });
    useOrderStore.getState().clear();
  });

  it('carga los gustos y muestra una subdivisión por grupo y el pedido actual', async () => {
    render(<OrderBoard />);
    expect(await screen.findByRole('region', { name: 'Empanadas' })).toBeDefined();
    expect(['Pizzas', 'Sanguches', 'Ciabattas', 'Coca-Cola', 'Pepsi'].map((name) => screen.getByRole('region', { name }).getAttribute('aria-label'))).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: 'Ver pedido' }));
    expect(screen.getByRole('region', { name: 'Pedido actual' })).toBeDefined();
  });

  it('del botón a la lista de gustos y al pedido', async () => {
    render(<OrderBoard />);
    fireEvent.click(within(await screen.findByRole('region', { name: 'Empanadas' })).getByRole('button', { name: /1 docena/ }));
    fireEvent.click(within((await screen.findByText('Carne')).closest('li') ?? document.body).getByRole('button', { name: 'Completar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver pedido (1)' }));
    expect(within(screen.getByRole('region', { name: 'Pedido actual' })).getByText('Carne')).toBeDefined();
    expect(screen.getByText('12 en pedido')).toBeDefined();
  });
});
