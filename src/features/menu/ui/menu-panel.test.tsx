import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { MenuPanel } from './menu-panel';

const actions = vi.hoisted(() => ({
  fetchMenuItems: vi.fn(),
  fetchMenuGroupPrices: vi.fn(),
  createMenuItemAction: vi.fn(),
  saveMenuGroupPricesAction: vi.fn(),
}));

vi.mock('@/features/menu/actions/fetch-menu-items', () => ({ fetchMenuItems: actions.fetchMenuItems }));
vi.mock('@/features/menu/actions/fetch-menu-group-prices', () => ({ fetchMenuGroupPrices: actions.fetchMenuGroupPrices }));
vi.mock('@/features/menu/actions/create-menu-item', () => ({ createMenuItemAction: actions.createMenuItemAction }));
vi.mock('@/features/menu/actions/save-menu-group-prices', () => ({ saveMenuGroupPricesAction: actions.saveMenuGroupPricesAction }));
vi.mock('@/features/menu/actions/update-menu-item', () => ({ updateMenuItemAction: vi.fn() }));
vi.mock('@/features/menu/actions/delete-menu-item', () => ({ deleteMenuItemAction: vi.fn() }));
vi.mock('@/features/menu/actions/toggle-menu-item-active', () => ({ toggleMenuItemActiveAction: vi.fn() }));

const CIABATTAS = { group: 'ciabattas' as const, price1: 6000, price3: null, price6: null, price12: null, version: 1, updatedAt: '' };

describe('pantalla de Alta de productos (US-3 CA-5 y CA-7)', () => {
  beforeEach(() => {
    useMenuStore.setState({ items: [], groupPrices: [], isLoaded: false });
    actions.fetchMenuItems.mockResolvedValue([]);
    actions.fetchMenuGroupPrices.mockResolvedValue([CIABATTAS]);
    actions.createMenuItemAction.mockResolvedValue({ success: true, message: 'Producto registrado/a exitosamente' });
    actions.saveMenuGroupPricesAction.mockResolvedValue({ success: true, message: 'Precios del grupo guardados exitosamente' });
  });

  it('carga los precios de cada grupo: las empanadas todavía no tienen y las ciabattas sí', async () => {
    render(<MenuPanel />);
    const empanadas = await screen.findByRole('form', { name: 'Precios de venta de Empanadas' });
    expect(within(empanadas).getByText('Sin precio: todavía no se puede vender')).toBeDefined();
    expect(within(screen.getByRole('form', { name: 'Precios de venta de Ciabattas' })).getByRole('textbox').getAttribute('value')).toBe('6000');
  });

  it('da de alta un sanguche con sus cuatro precios', async () => {
    render(<MenuPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo gusto o bebida' }));
    fireEvent.change(screen.getByLabelText('Grupo'), { target: { value: 'sanguches' } });
    fireEvent.change(screen.getByLabelText('Nombre del gusto o bebida'), { target: { value: 'Primavera' } });
    fireEvent.change(screen.getByLabelText('Costo para el local, por unidad'), { target: { value: '500' } });
    ['1 unidad', '3 unidades', '6 unidades', '12 unidades'].forEach((label, index) => fireEvent.change(screen.getByLabelText(`Precio de venta, ${label}`), { target: { value: String((index + 1) * 1000) } }));
    fireEvent.click(screen.getByRole('button', { name: 'Dar de alta' }));
    await waitFor(() => expect(actions.createMenuItemAction).toHaveBeenCalledWith({ group: 'sanguches', name: 'Primavera', unitCost: 500, prices: { price1: 1000, price3: 2000, price6: 3000, price12: 4000 } }), { timeout: 5000 });
  });

  it('no manda el alta si falta el nombre y muestra el error en el campo', async () => {
    render(<MenuPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo gusto o bebida' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dar de alta' }));
    expect(await screen.findByText('El nombre es obligatorio')).toBeDefined();
    expect(actions.createMenuItemAction).not.toHaveBeenCalled();
  });

  it('guarda los precios de las empanadas desde su tarjeta', async () => {
    render(<MenuPanel />);
    const card = await screen.findByRole('form', { name: 'Precios de venta de Empanadas' });
    within(card).getAllByRole('textbox').forEach((input, index) => fireEvent.change(input, { target: { value: String((index + 1) * 1000) } }));
    fireEvent.click(within(card).getByRole('button', { name: 'Guardar precios' }));
    await waitFor(() => expect(actions.saveMenuGroupPricesAction).toHaveBeenCalledWith({ group: 'empanadas', prices: { price1: 1000, price3: 2000, price6: 3000, price12: 4000 }, version: 0 }), { timeout: 10_000 });
  });

  it('regression BUG-15: al guardar, la tarjeta se vuelve a armar con los precios guardados', async () => {
    const saved = { group: 'empanadas' as const, price1: 1500.5, price3: 4000, price6: 7500, price12: 14000, version: 1, updatedAt: '' };
    actions.fetchMenuGroupPrices.mockResolvedValueOnce([CIABATTAS]).mockResolvedValue([CIABATTAS, saved]);
    render(<MenuPanel />);
    const card = await screen.findByRole('form', { name: 'Precios de venta de Empanadas' });
    ['1500,50', '4000', '7500', '14000'].forEach((value, index) => fireEvent.change(within(card).getAllByRole('textbox')[index], { target: { value } }));
    fireEvent.click(within(card).getByRole('button', { name: 'Guardar precios' }));
    await waitFor(() => expect(screen.queryByText('Sin precio: todavía no se puede vender')).toBeNull(), { timeout: 10_000 });
    expect(within(screen.getByRole('form', { name: 'Precios de venta de Empanadas' })).getAllByRole('textbox')[0].getAttribute('value')).toBe('1500.5');
  });
});
