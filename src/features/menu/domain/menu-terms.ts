import type { MenuGroup } from './menu-groups';

export const COST_TERM = 'Costo para el local';
export const SALE_PRICE_TERM = 'Precio de venta';

export function costLabelOf(group: MenuGroup | null): string {
  return `${COST_TERM}, por ${group === 'pizzas' ? 'pizza entera' : 'unidad'}`;
}
