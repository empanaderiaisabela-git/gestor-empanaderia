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

  it('las pizzas van de la más barata a la más cara y el buscador ignora mayúsculas y acentos (US-35)', () => {
    act(() => useOrderStore.getState().start('pizzas', 'pizza_1'));
    render(<FlavorPicker board={board} />);
    const gustos = (): string[] => within(screen.getByRole('list', { name: 'Gustos' })).getAllByRole('listitem').map((item) => item.querySelector('p')?.textContent ?? '');
    expect(gustos()).toEqual(['Muzza', 'Napolitana']);
    fireEvent.change(screen.getByLabelText('Buscar gusto'), { target: { value: 'NÁPO' } });
    expect(gustos()).toEqual(['Napolitana']);
    fireEvent.change(screen.getByLabelText('Buscar gusto'), { target: { value: 'fugazzeta' } });
    expect(screen.getByText('Ningún gusto coincide.')).toBeDefined();
  });

  it('al agregar, un aviso verde dice qué se sumó al pedido (US-35)', async () => {
    act(() => useOrderStore.getState().start('empanadas', 'u1'));
    render(<FlavorPicker board={board} />);
    fireEvent.click(within(rowOf('Pollo')).getByRole('button', { name: 'Agregar' }));
    const aviso = await screen.findByRole('status');
    expect(aviso.textContent).toBe('Se agregó Pollo al pedido');
    expect(aviso.className).toContain('bg-emerald-600');
  });

  it('cada agregado vuelve a bajar el aviso desde arriba', async () => {
    act(() => useOrderStore.getState().start('empanadas', 'u6'));
    render(<FlavorPicker board={board} />);
    fireEvent.click(within(rowOf('Carne')).getByRole('button', { name: 'Agregar uno' }));
    const primero = await screen.findByRole('status');
    fireEvent.click(within(rowOf('Carne')).getByRole('button', { name: 'Agregar uno' }));
    const segundo = await screen.findByRole('status');
    expect(segundo).not.toBe(primero);
    expect(segundo.className).toContain('animate-toast-drop');
  });

  it('"Quitar uno" va en rojo a la izquierda, resta una unidad y se apaga sin unidades (US-39)', () => {
    act(() => useOrderStore.getState().start('empanadas', 'u6'));
    render(<FlavorPicker board={board} />);
    const quitar = (): HTMLElement => within(rowOf('Carne')).getByRole('button', { name: 'Quitar uno' });
    expect([quitar().hasAttribute('disabled'), quitar().className.includes('bg-red-600')]).toEqual([true, true]);
    fireEvent.click(within(rowOf('Carne')).getByRole('button', { name: 'Agregar uno' }));
    fireEvent.click(quitar());
    expect(useOrderStore.getState().lines[0].flavors).toEqual([]);
    expect(within(rowOf('Carne')).getAllByRole('button').map((button) => button.textContent)).toEqual(['Quitar uno', 'Agregar uno', 'Completar']);
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
