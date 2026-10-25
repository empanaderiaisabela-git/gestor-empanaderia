import type { MenuGroupPriceDef } from '@/features/menu/domain/menu-group-price.schema';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';

export function menuItem(overrides: Partial<MenuItemDef> & Pick<MenuItemDef, 'id' | 'group' | 'name'>): MenuItemDef {
  return { unitCost: 100, stock: 50, price1: null, price3: null, price6: null, price12: null, isActive: true, isVisible: false, version: 1, createdAt: '', updatedAt: '', ...overrides };
}

export const ITEMS: MenuItemDef[] = [
  menuItem({ id: 'carne', group: 'empanadas', name: 'Carne' }),
  menuItem({ id: 'pollo', group: 'empanadas', name: 'Pollo', stock: 3 }),
  menuItem({ id: 'muzza', group: 'pizzas', name: 'Muzza', stock: 2, price1: 10000 }),
  menuItem({ id: 'napo', group: 'pizzas', name: 'Napolitana', stock: 2, price1: 12000 }),
  menuItem({ id: 'primavera', group: 'sanguches', name: 'Primavera', price1: 1600, price3: 4500, price6: 8600, price12: 16500 }),
  menuItem({ id: 'coca', group: 'coca_cola', name: 'Coca-Cola 1,5 L', price1: 3500 }),
];

export const GROUP_PRICES: MenuGroupPriceDef[] = [{ group: 'empanadas', price1: 1200, price3: 3400, price6: 6500, price12: 12000, version: 1, updatedAt: '' }];
