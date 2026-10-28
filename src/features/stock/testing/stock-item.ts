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
    isBase: false,
    version: 1,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}
