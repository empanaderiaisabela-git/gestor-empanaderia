import { create } from 'zustand';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';

type MenuState = {
  items: MenuItemDef[];
  isLoaded: boolean;
  setItems: (items: MenuItemDef[]) => void;
  setLoaded: (isLoaded: boolean) => void;
};

export const useMenuStore = create<MenuState>((set) => ({
  items: [],
  isLoaded: false,
  setItems: (items) => set({ items, isLoaded: true }),
  setLoaded: (isLoaded) => set({ isLoaded }),
}));
