import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrderStore } from '@/features/order/store/order.store';
import { ITEMS } from '../testing/board-fixtures';
import { CurrentOrder } from './current-order';
import { boardModelOf } from './use-order-board';

const store = () => useOrderStore.getState();
const PIZZA_X2 = { id: 'promo-x2', name: '2 pizzas', price: 20000, components: [{ group: 'pizzas' as const, presentationKey: 'pizza_1', quantity: 2 }] };

function addMuzza(): void {
  act(() => {
    store().start('pizzas', 'pizza_1');
    store().add('muzza', 'one');
    store().close();
  });
}

describe('jamón extra en el carrito (US-47 CA-3 y CA-4)', () => {
  beforeEach(() => {
    store().clear();
    store().setBuyer({ name: 'Marta' });
  });

  it('cada pizza entra con el jamón apagado; prenderlo suma el precio a cada pizza del renglón (D-1)', () => {
    addMuzza();
    act(() => store().addOne(store().lines[0].id));
    render(<CurrentOrder board={boardModelOf(ITEMS, false, 1500)} onCheckout={vi.fn()} />);
    const ham = screen.getByRole('switch', { name: 'Jamón extra' });
    expect(ham.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(ham);
    expect(screen.getByRole('switch', { name: 'Jamón extra' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Muzza + Jamón extra')).toBeDefined();
    expect(screen.getAllByText('$23.000').length).toBeGreaterThan(0);
  });

  it('una pizza nueva no se junta con el renglón con jamón, y apagarlo no los junta (P-9)', () => {
    addMuzza();
    act(() => store().toggleHam(store().lines[0].id));
    addMuzza();
    expect(store().lines.map((line) => [line.quantity, Boolean(line.ham)])).toEqual([[1, true], [1, false]]);
    act(() => store().toggleHam(store().lines[0].id));
    expect(store().lines).toHaveLength(2);
  });

  it('sin precio cargado, el switch está deshabilitado (P-2)', () => {
    addMuzza();
    render(<CurrentOrder board={boardModelOf(ITEMS)} onCheckout={vi.fn()} />);
    expect(screen.getByRole('switch', { name: 'Jamón extra' })).toHaveProperty('disabled', true);
  });

  it('cada pizza de una promo tiene su switch, que suma al precio de la promo (D-2)', () => {
    act(() => store().startPromo(PIZZA_X2));
    render(<CurrentOrder board={boardModelOf(ITEMS, false, 1500)} onCheckout={vi.fn()} />);
    expect(screen.getAllByRole('switch')).toHaveLength(2);
    fireEvent.click(screen.getByRole('switch', { name: 'Jamón extra (pizza 2)' }));
    expect(screen.getAllByText('$21.500').length).toBeGreaterThan(0);
  });

  it('las empanadas no tienen switch', () => {
    act(() => {
      store().start('empanadas', 'u1');
      store().add('carne', 'one');
      store().close();
    });
    render(<CurrentOrder board={boardModelOf(ITEMS, false, 1500)} onCheckout={vi.fn()} />);
    expect(screen.queryByRole('switch')).toBeNull();
  });
});
