import type { MenuGroupPrice } from '@/features/menu/repository/menu-group-price.repository';
import type { StockItem } from '@/features/stock/repository/stock.repository';

export function stockItem(overrides: Partial<StockItem> = {}): StockItem {
  return {
    id: crypto.randomUUID(),
    group: 'empanadas',
    name: 'Carne suave',
    unitCost: '400.00',
    stock: '10.0',
    price1: null,
    price3: null,
    price6: null,
    price12: null,
    isActive: true,
    isVisible: false,
    version: 1,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

export function groupPriceRow(overrides: Partial<MenuGroupPrice> = {}): MenuGroupPrice {
  return { group: 'empanadas', price1: '1200.00', price3: '3400.00', price6: '6500.00', price12: '12000.00', version: 1, updatedAt: new Date(0), ...overrides };
}
