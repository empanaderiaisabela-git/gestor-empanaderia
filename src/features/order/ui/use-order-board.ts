import { useEffect, useMemo, useState } from 'react';
import { fetchMenuItems } from '@/features/menu/actions/fetch-menu-items';
import { hasBase, type MenuGroup } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { useMenuStore } from '@/features/menu/store/menu.store';
import type { PriceBook } from '@/features/order/domain/order-pricing';

export type OrderBoardModel = {
  loading: boolean;
  itemsOf: (group: MenuGroup) => MenuItemDef[];
  book: PriceBook;
  nameOf: (menuItemId: string) => string;
  itemOf: (menuItemId: string) => MenuItemDef | undefined;
  baseOf: (group: MenuGroup) => MenuItemDef | null;
};

export function boardModelOf(items: MenuItemDef[], loading = false): OrderBoardModel {
  const baseOf = (group: MenuGroup): MenuItemDef | null => items.find((item) => item.isBase && item.group === group) ?? null;
  const inStock = (item: MenuItemDef): boolean => (hasBase(item.group) ? item.price1 !== null && (baseOf(item.group)?.stock ?? 0) >= 1 : item.stock > 0);
  const active = items.filter((item) => item.isActive && !item.isBase && inStock(item));
  const byId = new Map(active.map((item) => [item.id, item]));
  return {
    loading,
    itemsOf: (group) => active.filter((item) => item.group === group),
    book: { item: (id) => byId.get(id) },
    nameOf: (id) => byId.get(id)?.name ?? 'Producto',
    itemOf: (id) => byId.get(id),
    baseOf,
  };
}

export function useOrderBoard(): OrderBoardModel {
  const { items, isLoaded, setItems } = useMenuStore();
  const [loading, setLoading] = useState(!isLoaded);

  useEffect(() => {
    if (isLoaded) return setLoading(false);
    fetchMenuItems()
      .then(setItems)
      .finally(() => setLoading(false));
  }, [isLoaded, setItems]);

  return useMemo(() => boardModelOf(items, loading), [items, loading]);
}
