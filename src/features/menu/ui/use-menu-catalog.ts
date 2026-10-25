import { useState } from 'react';
import { fetchMenuItems } from '@/features/menu/actions/fetch-menu-items';
import { toggleMenuItemVisibilityAction } from '@/features/menu/actions/toggle-menu-item-visibility';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { useMenuStore } from '@/features/menu/store/menu.store';

type Notify = (type: 'success' | 'error', text: string) => void;

export type MenuCatalogModel = {
  photosOf: MenuItemDef | null;
  setPhotosOf: (item: MenuItemDef | null) => void;
  toggleVisible: (item: MenuItemDef) => Promise<void>;
};

export function useMenuCatalog(notify: Notify): MenuCatalogModel {
  const setItems = useMenuStore((state) => state.setItems);
  const [photosOf, setPhotosOf] = useState<MenuItemDef | null>(null);
  const toggleVisible = async (item: MenuItemDef): Promise<void> => {
    const result = await toggleMenuItemVisibilityAction({ id: item.id, isVisible: !item.isVisible, version: item.version });
    if (!result.success) return notify('error', result.error);
    notify('success', result.message ?? 'Catálogo actualizado');
    setItems(await fetchMenuItems());
  };
  return { photosOf, setPhotosOf, toggleVisible };
}
