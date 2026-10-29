import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useOrderStore } from '@/features/order/store/order.store';
import { ITEMS, menuItem } from '../testing/board-fixtures';
import { FlavorPicker } from './flavor-picker';
import { GroupCard } from './group-card';
import { boardModelOf } from './use-order-board';

const withPrepizzas = (stock: number) => ITEMS.map((item) => (item.id === 'prepizza' ? { ...item, stock } : item));
const rowOf = (name: string): HTMLElement => screen.getByText(name).closest('li') ?? document.body;

describe('Ventas con prepizzas (US-29 CA-5, D-3)', () => {
  beforeEach(() => useOrderStore.getState().clear());

  it('con prepizzas, aparecen los gustos de pizza con precio; ni la base ni un gusto sin precio', () => {
    const items = [...withPrepizzas(2), menuItem({ id: 'fuga', group: 'pizzas', name: 'Fugazzeta', stock: 0 })];
    expect(boardModelOf(items).itemsOf('pizzas').map((item) => item.name)).toEqual(['Muzza', 'Napolitana']);
  });

  it('sin prepizzas, los gustos de pizza desaparecen y la tarjeta lo avisa', () => {
    const board = boardModelOf(withPrepizzas(0));
    expect(board.itemsOf('pizzas')).toEqual([]);
    render(<GroupCard group='pizzas' board={board} />);
    expect(screen.getByText('Sin stock de Prepizza')).toBeDefined();
    expect(screen.getAllByRole('button').every((button) => button.hasAttribute('disabled'))).toBe(true);
  });

  it('el stock de cada gusto es el de la prepizza menos lo que ya está en el pedido', () => {
    const board = boardModelOf(withPrepizzas(2));
    act(() => {
      useOrderStore.getState().start('pizzas', 'pizza_2');
      useOrderStore.getState().add('muzza', 'one');
      useOrderStore.getState().add('napo', 'one');
      useOrderStore.getState().start('pizzas', 'pizza_1');
    });
    render(<FlavorPicker board={board} />);
    expect(within(rowOf('Napolitana')).getByText('$12.000 · stock 1')).toBeDefined();
    fireEvent.click(within(rowOf('Muzza')).getByRole('button', { name: 'Agregar' }));
    act(() => useOrderStore.getState().start('pizzas', 'pizza_1'));
    expect(within(rowOf('Napolitana')).getByText('$12.000 · stock 0')).toBeDefined();
    expect(within(rowOf('Napolitana')).getByRole('button', { name: 'Agregar' }).hasAttribute('disabled')).toBe(true);
  });
});
