import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useOrderStore } from '@/features/order/store/order.store';
import { GROUP_PRICES, ITEMS } from '../testing/board-fixtures';
import { GroupCard } from './group-card';
import { boardModelOf } from './use-order-board';

const board = boardModelOf(ITEMS, GROUP_PRICES);

describe('subdivisión de cada grupo en el tablero (US-5 CA-1)', () => {
  beforeEach(() => useOrderStore.getState().clear());

  it('empanadas: un botón por presentación con el precio del grupo', () => {
    render(<GroupCard group='empanadas' board={board} />);
    const card = screen.getByRole('region', { name: 'Empanadas' });
    expect(within(card).getAllByRole('button').map((button) => button.textContent)).toEqual(['1 unidad$1.200', '3 unidades$3.400', '½ docena$6.500', '1 docena$12.000']);
    expect(within(card).getByText('0 en pedido')).toBeDefined();
  });

  it('pizzas: 1 o 2 sabores, desde el precio más bajo', () => {
    render(<GroupCard group='pizzas' board={board} />);
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['1 sabordesde $10.000', '2 saboresdesde $10.000']);
  });

  it('tocar una presentación abre la línea y el contador suma las unidades del pedido', () => {
    render(<GroupCard group='empanadas' board={board} />);
    fireEvent.click(screen.getByRole('button', { name: /½ docena/ }));
    act(() => {
      useOrderStore.getState().add('carne', 'rest');
    });
    expect(screen.getByText('6 en pedido')).toBeDefined();
  });

  it('sin precio del grupo o sin gustos, los botones quedan deshabilitados y lo avisa', () => {
    render(<GroupCard group='ciabattas' board={board} />);
    expect(screen.getByText('Todavía no hay gustos cargados')).toBeDefined();
    render(<GroupCard group='empanadas' board={boardModelOf(ITEMS, [])} />);
    expect(screen.getByText('Falta cargar el precio del grupo')).toBeDefined();
    expect(screen.getAllByRole('button').every((button) => button.hasAttribute('disabled'))).toBe(true);
  });

  it.each([
    { group: 'empanadas' as const, emoji: '🥟', fill: 'bg-group-empanadas' },
    { group: 'pizzas' as const, emoji: '🍕', fill: 'bg-group-pizzas' },
    { group: 'coca_cola' as const, emoji: '🥤', fill: 'bg-group-coca' },
  ])('$group se rellena con su color y lleva su emoji Unicode (US-15)', ({ group, emoji, fill }) => {
    render(<GroupCard group={group} board={board} />);
    const card = screen.getAllByRole('region')[0];
    expect(card.className).toContain(fill);
    expect(within(card).getByText(emoji)).toBeDefined();
    expect(card.querySelector('svg')).toBeNull();
  });
});
