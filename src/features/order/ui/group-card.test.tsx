import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useOrderStore } from '@/features/order/store/order.store';
import { ITEMS } from '../testing/board-fixtures';
import { GroupCard } from './group-card';
import { boardModelOf } from './use-order-board';

const board = boardModelOf(ITEMS);

describe('subdivisión de cada grupo en el tablero (US-5 CA-1)', () => {
  beforeEach(() => useOrderStore.getState().clear());

  it('empanadas: un botón por presentación; con todos los gustos al mismo precio, ese precio (US-28)', () => {
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

  it('sin gustos, los botones quedan deshabilitados y lo avisa', () => {
    render(<GroupCard group='ciabattas' board={board} />);
    expect(screen.getByText('Todavía no hay gustos cargados')).toBeDefined();
    expect(screen.getAllByRole('button').every((button) => button.hasAttribute('disabled'))).toBe(true);
  });

  it('empanadas con precios distintos por gusto: desde el más bajo (US-28)', () => {
    const items = ITEMS.map((item) => (item.id === 'pollo' ? { ...item, price12: 13000 } : item));
    render(<GroupCard group='empanadas' board={boardModelOf(items)} />);
    expect(screen.getByRole('button', { name: /1 docena/ }).textContent).toBe('1 docenadesde $12.000');
  });

  it.each([
    { group: 'empanadas' as const, icon: 'empanada', fill: 'bg-group-empanadas' },
    { group: 'pizzas' as const, icon: 'pizza', fill: 'bg-group-pizzas' },
    { group: 'coca_cola' as const, icon: 'can-soda', fill: 'bg-group-coca' },
  ])('$group se rellena con su color y lleva su ícono de lucide (US-20)', ({ group, icon, fill }) => {
    render(<GroupCard group={group} board={board} />);
    const card = screen.getAllByRole('region')[0];
    expect(card.className).toContain(fill);
    expect(card.querySelector('svg')?.getAttribute('class')).toContain(`lucide-${icon}`);
  });
});
