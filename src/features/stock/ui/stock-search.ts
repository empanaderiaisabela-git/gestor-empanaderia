import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { priceList } from '@/features/menu/domain/menu-price-list';
import { CATEGORY_LABELS, categoryOf, hasOwnStock } from '@/features/stock/domain/stock-categories';
import { stockLevel } from '@/features/stock/domain/stock-level';
import { formatMoney } from '@/lib/format-money';

export const costText = (item: MenuItemDef): string => {
  if (item.isBase) return '—';
  return item.unitCost === null ? 'Sin costo' : formatMoney(item.unitCost);
};

const stockText = (item: MenuItemDef): string => {
  if (!hasOwnStock(item)) return '';
  return stockLevel(item) === 'empty' ? 'Sin stock' : item.stock.toLocaleString('es-AR');
};

const pricesText = (item: MenuItemDef): string[] => {
  if (item.isBase) return [];
  if (item.price1 === null) return ['Sin precio'];
  return priceList(item.group, item).map(({ label, value }) => `${label}: ${formatMoney(value)}`);
};

export function stockSearchText(item: MenuItemDef, isAdmin: boolean): string {
  return [CATEGORY_LABELS[categoryOf(item)], item.name, stockText(item), ...pricesText(item), isAdmin ? costText(item) : ''].join(' ');
}
