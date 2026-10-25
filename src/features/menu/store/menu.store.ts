import { create } from 'zustand';
import type { MenuGroupPriceDef } from '@/features/menu/domain/menu-group-price.schema';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';

type MenuState = {
  items: MenuItemDef[];
  groupPrices: MenuGroupPriceDef[];
  isLoaded: boolean;
  setItems: (items: MenuItemDef[]) => void;
  setGroupPrices: (groupPrices: MenuGroupPriceDef[]) => void;
  setLoaded: (isLoaded: boolean) => void;
};

export const useMenuStore = create<MenuState>((set) => ({
  items: [],
  groupPrices: [],
  isLoaded: false,
  setItems: (items) => set({ items, isLoaded: true }),
  setGroupPrices: (groupPrices) => set({ groupPrices }),
  setLoaded: (isLoaded) => set({ isLoaded }),
}));
