import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useOrderStore } from '@/features/order/store/order.store';
import { ITEMS } from '../testing/board-fixtures';
import { FlavorPicker } from './flavor-picker';
import { boardModelOf } from './use-order-board';

const board = boardModelOf(ITEMS);
const rowOf = (name: string): HTMLElement => screen.getByText(name).closest('li') ?? document.body;

describe('el tablero ofrece sólo gustos con stock (US-19)', () => {
  it('un gusto con stock 0, recién dado de alta o agotado, no aparece', () => {
    const items = [...ITEMS, { ...ITEMS[0], id: 'nuevo', name: 'Sin ingresar', stock: 0 }];
    expect(boardModelOf(items).itemsOf('empanadas').map((item) => item.name)).toEqual(['Carne', 'Pollo']);
  });
});

describe('lista de gustos de una presentación (US-5 CA-2 a CA-4)', () => {
  beforeEach(() => useOrderStore.getState().clear());

  it('½ docena: "Agregar uno" y "Completar"; muestra lo armado y lo que falta', () => {
    act(() => useOrderStore.getState().start('empanadas', 'u6'));
    render(<FlavorPicker board={board} />);
    fireEvent.click(within(rowOf('Carne')).getByRole('button', { name: 'Agregar uno' }));
    fireEvent.click(within(rowOf('Carne')).getByRole('button', { name: 'Agregar uno' }));
    expect(screen.getByText('2 Carne · faltan 4')).toBeDefined();
    expect(within(rowOf('Pollo')).getByRole('button', { name: 'Completar' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(within(rowOf('Carne')).getByRole('button', { name: 'Completar' }));
    expect(useOrderStore.getState().lines[0]).toMatchObject({ flavors: [{ menuItemId: 'carne', units: 6 }] });
  });

  it('muestra el precio y el stock que queda, descontando lo del pedido', () => {
    act(() => useOrderStore.getState().start('empanadas', 'u1'));
    render(<FlavorPicker board={board} />);
    expect(within(rowOf('Pollo')).getByText('$1.200 · stock 3')).toBeDefined();
    fireEvent.click(within(rowOf('Pollo')).getByRole('button', { name: 'Agregar' }));
    expect(within(rowOf('Pollo')).getByText('$1.200 · stock 2')).toBeDefined();
  });

  it('pizza de 2 sabores: no deja repetir el primer sabor', () => {
    act(() => useOrderStore.getState().start('pizzas', 'pizza_2'));
    render(<FlavorPicker board={board} />);
    fireEvent.click(within(rowOf('Muzza')).getByRole('button', { name: 'Agregar' }));
    expect(within(rowOf('Muzza')).getByRole('button', { name: 'Agregar' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(within(rowOf('Napolitana')).getByRole('button', { name: 'Agregar' }));
    expect(useOrderStore.getState().lines[0].flavors).toEqual([{ menuItemId: 'muzza', units: 0.5 }, { menuItemId: 'napo', units: 0.5 }]);
  });

  it('las bebidas de Coca-Cola se suman de a una y "Listo" cierra la lista', () => {
    act(() => useOrderStore.getState().start('coca_cola', 'u1'));
    render(<FlavorPicker board={board} />);
    fireEvent.click(within(rowOf('Coca-Cola 1,5 L')).getByRole('button', { name: 'Agregar' }));
    fireEvent.click(within(rowOf('Coca-Cola 1,5 L')).getByRole('button', { name: 'Agregar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    expect(useOrderStore.getState().lines).toMatchObject([{ group: 'coca_cola', quantity: 2 }]);
    expect(screen.queryByRole('button', { name: 'Listo' })).toBeNull();
  });
});
