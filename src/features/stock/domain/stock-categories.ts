import { GROUPS, hasBase } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';

export const STOCK_CATEGORIES = ['empanadas', 'prepizzas', 'pizzas', 'sanguches', 'panes_ciabatta', 'ciabattas', 'coca_cola', 'pepsi'] as const;
export type StockCategory = (typeof STOCK_CATEGORIES)[number];

type Categorized = Pick<MenuItemDef, 'group' | 'isBase'>;

export const CATEGORY_LABELS: Readonly<Record<StockCategory, string>> = {
  empanadas: GROUPS.empanadas.label,
  prepizzas: 'Prepizza',
  pizzas: GROUPS.pizzas.label,
  sanguches: GROUPS.sanguches.label,
  panes_ciabatta: 'Pan de ciabatta',
  ciabattas: GROUPS.ciabattas.label,
  coca_cola: GROUPS.coca_cola.label,
  pepsi: GROUPS.pepsi.label,
};

export const hasOwnStock = (item: Categorized): boolean => item.isBase || !hasBase(item.group);

export const STOCKED_CATEGORIES: readonly StockCategory[] = STOCK_CATEGORIES.filter((category) => category !== 'pizzas' && category !== 'ciabattas');

export const isStockCategory = (value: string): value is StockCategory => STOCK_CATEGORIES.some((category) => category === value);

export const isBaseCategory = (category: string): boolean => category === 'prepizzas' || category === 'panes_ciabatta';

export const isPriceOnlyCategory = (category: string): boolean => category === 'pizzas' || category === 'ciabattas';

export function categoryOf(item: Categorized): StockCategory {
  if (!item.isBase) return item.group;
  return item.group === 'pizzas' ? 'prepizzas' : 'panes_ciabatta';
}
