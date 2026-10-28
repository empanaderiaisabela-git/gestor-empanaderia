import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrderStore } from '@/features/order/store/order.store';
import { GROUP_PRICES, ITEMS } from '../testing/board-fixtures';
import { CurrentOrder } from './current-order';
import { boardModelOf } from './use-order-board';

const board = boardModelOf(ITEMS, GROUP_PRICES);
const store = () => useOrderStore.getState();

function build(group: 'empanadas' | 'pizzas', key: string, picks: [string, 'one' | 'rest'][]): void {
  act(() => {
    store().start(group, key);
    picks.forEach(([id, mode]) => store().add(id, mode));
    store().close();
  });
}

describe('pedido actual (US-5 CA-5 y CA-6)', () => {
  beforeEach(() => store().clear());

  it('"Quitar uno" resta una unidad de la línea (US-22)', () => {
    build('empanadas', 'u1', [['carne', 'one'], ['carne', 'one']]);
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    expect(screen.getByText('1 unidad × 2')).toBeDefined();
    fireEvent.click(screen.getByTitle('Quitar uno'));
    expect(screen.getByText('1 unidad')).toBeDefined();
  });

  it('vacío: lo dice y no se puede cobrar', () => {
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    expect(screen.getByText('No hay productos en el pedido')).toBeDefined();
    expect(screen.getByRole('button', { name: /Cobrar/ }).hasAttribute('disabled')).toBe(true);
  });

  it('lista comida, cantidad, unidades e importe, y suma el total', () => {
    build('empanadas', 'u6', [['carne', 'one'], ['carne', 'one'], ['pollo', 'rest']]);
    build('pizzas', 'pizza_2', [['muzza', 'one'], ['napo', 'one']]);
    const onCheckout = vi.fn();
    render(<CurrentOrder board={board} onCheckout={onCheckout} />);
    expect(screen.getByText('2 Carne + 4 Pollo')).toBeDefined();
    expect(screen.getByText('$18.500', { selector: 'span' })).toBeDefined();
    expect(screen.getByText('Muzza / Napolitana')).toBeDefined();
    expect(screen.getByText('$12.000')).toBeDefined();
  });

  it('una línea incompleta muestra "faltan N" y bloquea el cobro', () => {
    build('empanadas', 'u6', [['carne', 'one']]);
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    expect(screen.getByText('faltan 5')).toBeDefined();
    expect(screen.getByRole('button', { name: /Cobrar/ }).hasAttribute('disabled')).toBe(true);
  });

  it('completo, cobra el total; quitar y vaciar limpian el pedido', () => {
    build('empanadas', 'u12', [['carne', 'rest']]);
    const onCheckout = vi.fn();
    render(<CurrentOrder board={board} onCheckout={onCheckout} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cobrar $12.000' }));
    expect(onCheckout).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle('Quitar del pedido'));
    expect(store().lines).toEqual([]);
  });

  it('el comprador es opcional y queda en el pedido hasta vaciar (CA-6)', () => {
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Sin nombre'), { target: { value: 'Juan' } });
    expect(store().buyerName).toBe('Juan');
    fireEvent.click(screen.getByRole('button', { name: /Vaciar/ }));
    expect(store().buyerName).toBe('');
  });
});
