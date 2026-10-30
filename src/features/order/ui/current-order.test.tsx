import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrderStore } from '@/features/order/store/order.store';
import { ITEMS } from '../testing/board-fixtures';
import { CurrentOrder } from './current-order';
import { boardModelOf } from './use-order-board';

const board = boardModelOf(ITEMS);
const store = () => useOrderStore.getState();

function build(group: 'empanadas' | 'pizzas', key: string, picks: [string, 'one' | 'rest'][]): void {
  act(() => {
    store().start(group, key);
    picks.forEach(([id, mode]) => store().add(id, mode));
    store().close();
  });
}

describe('pedido actual (US-5 CA-5 y CA-6)', () => {
  beforeEach(() => {
    store().clear();
    store().setBuyer({ name: 'Marta' });
  });

  it('"Quitar uno" resta una unidad de la línea (US-22)', () => {
    build('empanadas', 'u1', [['carne', 'one'], ['carne', 'one']]);
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    expect(screen.getByText('1 unidad × 2')).toBeDefined();
    fireEvent.click(screen.getByTitle('Quitar uno'));
    expect(screen.getByText('1 unidad')).toBeDefined();
  });

  it('"Sumar uno" agrega una unidad y se apaga sin stock (US-36)', () => {
    build('empanadas', 'u1', [['pollo', 'one'], ['pollo', 'one']]);
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Sumar uno'));
    expect(screen.getByText('1 unidad × 3')).toBeDefined();
    expect(screen.getByTitle('Sumar uno').hasAttribute('disabled')).toBe(true);
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

  it('cantidad y unidades van separadas y en un renglón (BUG-26)', () => {
    build('empanadas', 'u1', [['carne', 'one'], ['carne', 'one']]);
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    for (const cell of [screen.getByRole('columnheader', { name: 'Cantidad' }), screen.getByRole('columnheader', { name: 'Unidades' }), screen.getByText('1 unidad × 2')]) {
      expect(cell.className).toContain('px-3');
      expect(cell.className).toContain('whitespace-nowrap');
    }
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

  it('sin el nombre del cliente no se cobra, y los datos quedan hasta vaciar (US-37 CA-2)', () => {
    build('empanadas', 'u1', [['carne', 'one']]);
    act(() => store().setBuyer({ name: '' }));
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Cobrar/ }).hasAttribute('disabled')).toBe(true);
    fireEvent.change(screen.getByLabelText('Nombre del cliente'), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText('Domicilio (opcional)'), { target: { value: 'Mitre 123' } });
    expect(screen.getByRole('button', { name: /Cobrar/ }).hasAttribute('disabled')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /Vaciar/ }));
    expect(store().buyer).toEqual({ customerId: null, name: '', phone: '', address: '' });
  });
});
