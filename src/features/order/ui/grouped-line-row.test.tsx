import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrderStore } from '@/features/order/store/order.store';
import { ITEMS } from '../testing/board-fixtures';
import { CurrentOrder } from './current-order';
import { boardModelOf } from './use-order-board';

const board = boardModelOf(ITEMS);
const store = () => useOrderStore.getState();
const row = () => within(screen.getByText('Carne', { selector: 'span' }).closest('tr') ?? document.body);

function addLine(presentationKey: string, mode: 'one' | 'rest'): void {
  act(() => {
    store().start('empanadas', presentationKey);
    store().add('carne', mode);
    store().close();
  });
}

describe('ítem agrupado del carrito (US-64)', () => {
  beforeEach(() => {
    act(() => {
      store().clear();
      store().setBuyer({ name: 'Marta' });
    });
    addLine('u6', 'rest');
    addLine('u1', 'one');
  });

  it('½ docena + 1 unidad del mismo gusto se ven en una fila con 7 unidades y el precio de siempre (CA-1)', () => {
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    expect(screen.getAllByText('Carne', { selector: 'span' })).toHaveLength(1);
    expect(row().getByText('½ docena + 1 unidad')).toBeDefined();
    expect(row().getByText('7')).toBeDefined();
    expect(row().getByText('$7.700')).toBeDefined();
  });

  it('"+" suma 1 unidad y "−" saca primero las sueltas y después la ½ docena (CA-2)', () => {
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    fireEvent.click(row().getByTitle('Sumar uno'));
    expect(row().getByText('½ docena + 1 unidad × 2')).toBeDefined();
    fireEvent.click(row().getByTitle('Quitar uno'));
    fireEvent.click(row().getByTitle('Quitar uno'));
    expect(store().lines.map((line) => line.presentationKey)).toEqual(['u6']);
  });

  it('el tacho saca todo el ítem', () => {
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    fireEvent.click(row().getByTitle('Quitar del pedido'));
    expect(store().lines).toEqual([]);
  });
});
