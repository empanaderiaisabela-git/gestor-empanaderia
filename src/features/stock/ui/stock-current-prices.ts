import { isPricedByGroup } from '@/features/menu/domain/menu-groups';
import type { MenuGroupPriceDef } from '@/features/menu/domain/menu-group-price.schema';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import type { PriceValues } from '@/features/menu/domain/menu-price-list';

export function currentPricesOf(item: MenuItemDef, groupPrices: MenuGroupPriceDef[]): PriceValues {
  if (!isPricedByGroup(item.group)) return item;
  return groupPrices.find((row) => row.group === item.group) ?? {};
}
