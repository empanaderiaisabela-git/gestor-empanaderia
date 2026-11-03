import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrderStore } from '@/features/order/store/order.store';
import type { ShippingDef } from '@/features/shipping/domain/shipping.schema';
import { useShippingStore } from '@/features/shipping/store/shipping.store';
import { ITEMS } from '../testing/board-fixtures';
import { CurrentOrder } from './current-order';
import { boardModelOf } from './use-order-board';

const board = boardModelOf(ITEMS);
const store = () => useOrderStore.getState();
const CENTRO: ShippingDef = { id: 's1', title: 'Centro', detail: '', amount: 1500, isActive: true, version: 1, createdAt: '', updatedAt: '' };
const NORTE: ShippingDef = { ...CENTRO, id: 's2', title: 'Norte', isActive: false };
const cobrar = () => screen.getByRole('button', { name: /Cobrar/ });

describe('envío en el carrito (US-59 CA-1 y CA-2)', () => {
  beforeEach(() => {
    useShippingStore.setState({ shippings: [CENTRO, NORTE], isLoaded: true });
    act(() => {
      store().clear();
      store().setBuyer({ name: 'Marta' });
      store().start('empanadas', 'u1');
      store().add('carne', 'one');
      store().close();
    });
  });

  it('ofrece "Sin envío" y los envíos activos con su monto', () => {
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Sin envío', 'Centro · $1.500']);
  });

  it('el envío elegido suma al total y a "Cobrar"; volver a "Sin envío" lo saca', () => {
    act(() => store().setBuyer({ address: 'Mitre 123' }));
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    const before = cobrar().textContent;
    fireEvent.change(screen.getByLabelText('Envío'), { target: { value: 's1' } });
    expect(store().shippingId).toBe('s1');
    expect(cobrar().textContent).not.toBe(before);
    expect(cobrar().hasAttribute('disabled')).toBe(false);
    fireEvent.change(screen.getByLabelText('Envío'), { target: { value: '' } });
    expect([store().shippingId, cobrar().textContent]).toEqual([null, before]);
  });

  it('con envío y sin domicilio, "Cobrar" se apaga y avisa "Falta el domicilio" (D-4)', () => {
    act(() => store().setShipping('s1'));
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    expect(screen.getByText('Falta el domicilio')).toBeDefined();
    expect(cobrar().hasAttribute('disabled')).toBe(true);
  });

  it('"Vaciar" vuelve a "Sin envío"', () => {
    act(() => store().setShipping('s1'));
    render(<CurrentOrder board={board} onCheckout={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Vaciar/ }));
    expect(store().shippingId).toBeNull();
  });
});
