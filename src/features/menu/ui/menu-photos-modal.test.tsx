import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteMenuPhotoAction } from '@/features/menu/actions/delete-menu-photo';
import { fetchMenuItems } from '@/features/menu/actions/fetch-menu-items';
import { fetchMenuPhotos } from '@/features/menu/actions/fetch-menu-photos';
import { toggleMenuItemVisibilityAction } from '@/features/menu/actions/toggle-menu-item-visibility';
import { uploadMenuPhotoAction } from '@/features/menu/actions/upload-menu-photo';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { menuItem } from '@/features/order/testing/board-fixtures';
import { MenuPhotosModal } from './menu-photos-modal';
import { useMenuCatalog } from './use-menu-catalog';

vi.mock('@/features/menu/actions/fetch-menu-photos', () => ({ fetchMenuPhotos: vi.fn() }));
vi.mock('@/features/menu/actions/upload-menu-photo', () => ({ uploadMenuPhotoAction: vi.fn() }));
vi.mock('@/features/menu/actions/delete-menu-photo', () => ({ deleteMenuPhotoAction: vi.fn() }));
vi.mock('@/features/menu/actions/toggle-menu-item-visibility', () => ({ toggleMenuItemVisibilityAction: vi.fn() }));
vi.mock('@/features/menu/actions/fetch-menu-items', () => ({ fetchMenuItems: vi.fn(async () => []) }));

const MUZZA: MenuItemDef = menuItem({ id: '11111111-1111-4111-8111-111111111111', group: 'pizzas', name: 'Muzza', version: 3 });
const PHOTO = { publicId: 'menu/muzza/1', url: 'https://fotos.test/1.webp', createdAt: '' };

describe('fotos de un gusto en Alta de productos (T-12 CA-1)', () => {
  beforeEach(() => {
    vi.mocked(fetchMenuPhotos).mockReset().mockResolvedValue([]);
    vi.mocked(uploadMenuPhotoAction).mockReset().mockResolvedValue({ success: true, data: PHOTO });
    vi.mocked(deleteMenuPhotoAction).mockReset().mockResolvedValue({ success: true });
  });

  it('sin fotos lo dice; subir una manda la imagen en base64 y la muestra', async () => {
    render(<MenuPhotosModal item={MUZZA} onClose={vi.fn()} />);
    expect(await screen.findByText('Todavía no tiene fotos.')).toBeDefined();
    vi.mocked(fetchMenuPhotos).mockResolvedValue([PHOTO]);
    const file = new File(['png'], 'muzza.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Agregar foto'), { target: { files: [file] } });
    expect(await screen.findByAltText('Foto de Muzza')).toBeDefined();
    expect(uploadMenuPhotoAction).toHaveBeenCalledWith({ menuItemId: MUZZA.id, image: expect.stringMatching(/^data:image\/png;base64,/) });
  });

  it('borrar una foto la saca; un rechazo del servidor se muestra', async () => {
    vi.mocked(fetchMenuPhotos).mockResolvedValue([PHOTO]);
    vi.mocked(deleteMenuPhotoAction).mockResolvedValue({ success: false, code: 'NOT_FOUND', error: 'El/la foto seleccionado ya no existe.' });
    render(<MenuPhotosModal item={MUZZA} onClose={vi.fn()} />);
    fireEvent.click(await screen.findByTitle('Eliminar foto'));
    expect(await screen.findByText('El/la foto seleccionado ya no existe.')).toBeDefined();
    expect(deleteMenuPhotoAction).toHaveBeenCalledWith({ publicId: PHOTO.publicId });
  });
});

describe('mostrar u ocultar un gusto en el catálogo (T-12 CA-4)', () => {
  it('manda la versión de la grilla, avisa y recarga los gustos', async () => {
    vi.mocked(toggleMenuItemVisibilityAction).mockResolvedValue({ success: true, message: 'Muzza se muestra en el catálogo' });
    useMenuStore.setState({ isLoaded: true });
    const notify = vi.fn();
    const { result } = renderHook(() => useMenuCatalog(notify));
    await act(() => result.current.toggleVisible(MUZZA));
    expect(toggleMenuItemVisibilityAction).toHaveBeenCalledWith({ id: MUZZA.id, isVisible: true, version: 3 });
    expect(notify).toHaveBeenCalledWith('success', 'Muzza se muestra en el catálogo');
    await waitFor(() => expect(fetchMenuItems).toHaveBeenCalled());
  });

  it('si falla, avisa el error', async () => {
    vi.mocked(toggleMenuItemVisibilityAction).mockResolvedValue({ success: false, code: 'STALE_VERSION', error: 'Los datos cambiaron.' });
    const notify = vi.fn();
    const { result } = renderHook(() => useMenuCatalog(notify));
    await act(() => result.current.toggleVisible({ ...MUZZA, isVisible: true }));
    expect(toggleMenuItemVisibilityAction).toHaveBeenLastCalledWith({ id: MUZZA.id, isVisible: false, version: 3 });
    expect(notify).toHaveBeenCalledWith('error', 'Los datos cambiaron.');
  });
});
