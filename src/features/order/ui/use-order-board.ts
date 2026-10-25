import { useEffect, useMemo, useState } from 'react';
import { fetchMenuGroupPrices } from '@/features/menu/actions/fetch-menu-group-prices';
import { fetchMenuItems } from '@/features/menu/actions/fetch-menu-items';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import type { MenuGroupPriceDef } from '@/features/menu/domain/menu-group-price.schema';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { useMenuStore } from '@/features/menu/store/menu.store';
import type { PriceBook } from '@/features/order/domain/order-pricing';

export type OrderBoardModel = {
  loading: boolean;
  itemsOf: (group: MenuGroup) => MenuItemDef[];
  book: PriceBook;
  hasGroupPrice: (group: MenuGroup) => boolean;
  nameOf: (menuItemId: string) => string;
  stockOf: (menuItemId: string) => number;
};

export function boardModelOf(items: MenuItemDef[], groupPrices: MenuGroupPriceDef[], loading = false): OrderBoardModel {
  const active = items.filter((item) => item.isActive);
  const byId = new Map(active.map((item) => [item.id, item]));
  return {
    loading,
    itemsOf: (group) => active.filter((item) => item.group === group),
    book: { item: (id) => byId.get(id), group: (group) => groupPrices.find((row) => row.group === group) },
    hasGroupPrice: (group) => groupPrices.some((row) => row.group === group),
    nameOf: (id) => byId.get(id)?.name ?? 'Producto',
    stockOf: (id) => byId.get(id)?.stock ?? 0,
  };
}

export function useOrderBoard(): OrderBoardModel {
  const { items, groupPrices, isLoaded, setItems, setGroupPrices } = useMenuStore();
  const [loading, setLoading] = useState(!isLoaded);

  useEffect(() => {
    if (isLoaded) return setLoading(false);
    Promise.all([fetchMenuGroupPrices(), fetchMenuItems()])
      .then(([prices, rows]) => {
        setGroupPrices(prices);
        setItems(rows);
      })
      .finally(() => setLoading(false));
  }, [isLoaded, setItems, setGroupPrices]);

  return useMemo(() => boardModelOf(items, groupPrices, loading), [items, groupPrices, loading]);
}
