import type { MenuGroup } from './menu-groups';

export const COST_TERM = 'Costo para el local';
export const SALE_PRICE_TERM = 'Precio de venta';
export const COST_HINT = 'Lo que te cuesta hacerlo o comprarlo. No es el precio de venta.';
export const SALE_PRICE_HINT = 'Lo que paga el cliente.';

export function costLabelOf(group: MenuGroup | null): string {
  return `${COST_TERM}, por ${group === 'pizzas' ? 'pizza entera' : 'unidad'}`;
}
