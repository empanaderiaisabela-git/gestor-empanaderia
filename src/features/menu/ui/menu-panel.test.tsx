import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { MenuPanel } from './menu-panel';

const actions = vi.hoisted(() => ({ fetchMenuItems: vi.fn(), createMenuItemAction: vi.fn() }));

vi.mock('@/features/menu/actions/fetch-menu-items', () => ({ fetchMenuItems: actions.fetchMenuItems }));
vi.mock('@/features/menu/actions/create-menu-item', () => ({ createMenuItemAction: actions.createMenuItemAction }));
vi.mock('@/features/menu/actions/update-menu-item', () => ({ updateMenuItemAction: vi.fn() }));
vi.mock('@/features/menu/actions/delete-menu-item', () => ({ deleteMenuItemAction: vi.fn() }));
vi.mock('@/features/menu/actions/toggle-menu-item-active', () => ({ toggleMenuItemActiveAction: vi.fn() }));

describe('pantalla de Alta de productos', () => {
  beforeEach(() => {
    useMenuStore.setState({ items: [], isLoaded: false });
    actions.fetchMenuItems.mockResolvedValue([]);
    actions.createMenuItemAction.mockResolvedValue({ success: true, message: 'Se registró el producto' });
  });

  it('da de alta un sanguche con grupo y nombre', async () => {
    render(<MenuPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo gusto o bebida' }));
    fireEvent.change(screen.getByLabelText('Grupo'), { target: { value: 'sanguches' } });
    fireEvent.change(screen.getByLabelText('Nombre del gusto o bebida'), { target: { value: 'Primavera' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dar de alta' }));
    await waitFor(() => expect(actions.createMenuItemAction).toHaveBeenCalledWith({ group: 'sanguches', name: 'Primavera' }), { timeout: 5000 });
  });

  it('no manda el alta si falta el nombre y muestra el error en el campo', async () => {
    render(<MenuPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo gusto o bebida' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dar de alta' }));
    expect(await screen.findByText('El nombre es obligatorio')).toBeDefined();
    expect(actions.createMenuItemAction).not.toHaveBeenCalled();
  });

  it('ya no tiene tarjetas de precio por grupo: los precios se cargan en Stock (US-28)', async () => {
    render(<MenuPanel />);
    await screen.findByRole('button', { name: 'Nuevo gusto o bebida' });
    expect(screen.queryByRole('form', { name: /^Precios de/ })).toBeNull();
  });
});
