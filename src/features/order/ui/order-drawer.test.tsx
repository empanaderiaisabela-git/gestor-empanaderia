import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PromotionDef } from '@/features/promotion/domain/promotion.schema';
import { useOrderStore } from '@/features/order/store/order.store';
import { ITEMS } from '../testing/board-fixtures';
import { OrderDrawer } from './order-drawer';
import { boardModelOf } from './use-order-board';

const board = boardModelOf(ITEMS);
const store = () => useOrderStore.getState();
const PROMO: PromotionDef = { id: 'p1', name: 'Media + Coca', price: 9000, isActive: true, version: 1, components: [{ group: 'coca_cola', presentationKey: 'u1', quantity: 1 }], createdAt: '', updatedAt: '' };

function addDozen(): void {
  act(() => {
    store().start('empanadas', 'u12');
    store().add('carne', 'rest');
    store().close();
  });
}

describe('carrito desplegable de Ventas (US-24)', () => {
  beforeEach(() => store().clear());

  it('cerrado: sólo se ve el botón del ticket, sin número con el pedido vacío', () => {
    render(<OrderDrawer board={board} onCheckout={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Ver pedido' })).toBeDefined();
    expect(screen.queryByRole('region', { name: 'Pedido actual' })).toBeNull();
  });

  it('el número cuenta productos: una docena suma 1 y una promo suma 1', () => {
    render(<OrderDrawer board={board} onCheckout={vi.fn()} />);
    addDozen();
    act(() => {
      store().startPromo(PROMO);
      store().addToOpenPromo('coca', 'one');
    });
    expect(screen.getByRole('button', { name: 'Ver pedido (2)' })).toBeDefined();
  });

  it('el botón abre el pedido; la X y Escape lo cierran', () => {
    addDozen();
    render(<OrderDrawer board={board} onCheckout={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver pedido (1)' }));
    expect(screen.getByRole('region', { name: 'Pedido actual' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar pedido' }));
    expect(screen.queryByRole('region', { name: 'Pedido actual' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ver pedido (1)' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('region', { name: 'Pedido actual' })).toBeNull();
  });

  it('Cobrar cierra el carrito y abre el cobro', () => {
    addDozen();
    const onCheckout = vi.fn();
    render(<OrderDrawer board={board} onCheckout={onCheckout} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver pedido (1)' }));
    fireEvent.click(screen.getByRole('button', { name: /Cobrar/ }));
    expect(onCheckout).toHaveBeenCalledOnce();
    expect(screen.queryByRole('region', { name: 'Pedido actual' })).toBeNull();
  });
});
