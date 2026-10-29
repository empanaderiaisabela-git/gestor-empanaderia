import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { hasOwnStock } from './stock-categories';

export const STOCK_ORDERS = ['categoria', 'creciente', 'decreciente', 'sin_stock', 'con_stock'] as const;
export type StockOrder = (typeof STOCK_ORDERS)[number];

export const ORDER_LABELS: Readonly<Record<StockOrder, string>> = {
  categoria: 'Orden por categoría',
  creciente: 'Stock creciente',
  decreciente: 'Stock decreciente',
  sin_stock: 'Solo sin stock',
  con_stock: 'Quitar sin stock',
};

type Counted = Pick<MenuItemDef, 'group' | 'isBase' | 'stock'>;

export const isStockOrder = (value: string): value is StockOrder => STOCK_ORDERS.some((order) => order === value);

const isOut = (item: Counted): boolean => hasOwnStock(item) && item.stock <= 0;

export function orderStock<T extends Counted>(items: readonly T[], order: StockOrder): T[] {
  if (order === 'sin_stock') return items.filter(isOut);
  if (order === 'con_stock') return items.filter((item) => !isOut(item));
  if (order === 'categoria') return [...items];
  const sign = order === 'creciente' ? 1 : -1;
  const counted = items.filter(hasOwnStock).sort((a, b) => sign * (a.stock - b.stock));
  return [...counted, ...items.filter((item) => !hasOwnStock(item))];
}
