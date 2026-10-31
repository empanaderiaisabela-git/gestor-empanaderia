import { AppError } from '@/lib/errors';
import { BASE_GROUPS } from '@/features/menu/domain/menu-groups';
import { describeFlavors } from '@/features/order/domain/order-describe';
import type { OrderLine } from '@/features/order/domain/order-line';
import { linePrice, type PriceBook, type Prices, unitLinePrice } from '@/features/order/domain/order-pricing';
import { type BaseOf, lineUsage, orderUsage, stockUsage } from '@/features/order/domain/order-usage';
import { isValidLine } from '@/features/order/domain/order-validation';
import type { CheckoutScope } from '@/features/order/repository/checkout-unit-of-work';
import type { NewSaleLine } from '@/features/order/repository/sale-writer.repository';
import type { StockItem } from '@/features/stock/repository/stock.repository';

export type LockedItems = Map<string, StockItem>;
export type PricedLine = { line: OrderLine; unitPrice: number; subtotal: number };
type PriceColumns = Pick<StockItem, 'price1' | 'price3' | 'price6' | 'price12'>;

const amount = (value: string | null): number | null => (value === null ? null : Number(value));
const pricesOf = (row: PriceColumns): Prices => ({ price1: amount(row.price1), price3: amount(row.price3), price6: amount(row.price6), price12: amount(row.price12) });

const found = (item: StockItem | null | undefined): StockItem => {
  if (!item) throw new AppError('NOT_FOUND', { entity: 'el producto' });
  return item;
};

export function itemOf(items: LockedItems, id: string): StockItem {
  return found(items.get(id));
}

export async function lockFlavors(scope: CheckoutScope, lines: OrderLine[]): Promise<LockedItems> {
  const items: LockedItems = new Map();
  for (const id of [...orderUsage(lines).keys()].sort()) items.set(id, found(await scope.stock.lockItem(id)));
  for (const group of BASE_GROUPS.filter((baseGroup) => lines.some((line) => line.group === baseGroup))) {
    const base = found(await scope.stock.lockBase(group));
    items.set(base.id, base);
  }
  return items;
}

const baseIn = (items: LockedItems): BaseOf => (group) => [...items.values()].find((item) => item.isBase && item.group === group)?.id ?? null;

export function assertSellable(lines: OrderLine[], items: LockedItems): void {
  const ofGroup = (line: OrderLine, id: string): boolean => {
    const item = itemOf(items, id);
    return item.isActive && !item.isBase && item.group === line.group;
  };
  if (!lines.every((line) => isValidLine(line) && line.flavors.every(({ menuItemId }) => ofGroup(line, menuItemId)))) throw new AppError('VALIDATION');
}

export function priceBookOf(items: LockedItems, ham: number | null): PriceBook {
  return {
    item: (id) => {
      const row = items.get(id);
      return row && pricesOf(row);
    },
    ham,
  };
}

export function priceLine(line: OrderLine, book: PriceBook): PricedLine {
  const unitPrice = unitLinePrice(line, book);
  const subtotal = linePrice(line, book);
  if (unitPrice === null || subtotal === null) throw new AppError('VALIDATION');
  return { line, unitPrice, subtotal };
}

export async function consumeStock(scope: CheckoutScope, items: LockedItems, lines: OrderLine[]): Promise<void> {
  const usage = [...stockUsage(lines, baseIn(items))].map(([id, units]) => ({ item: itemOf(items, id), units }));
  const short = usage.find(({ item, units }) => units > Number(item.stock));
  if (short) throw new AppError('INSUFFICIENT_STOCK', { entity: short.item.name });
  for (const { item, units } of usage) {
    const saved = await scope.stock.saveItem(item, { stock: Number(item.stock) - units });
    if (!saved) throw new AppError('STALE_VERSION');
  }
}

export function saleLineOf({ line, unitPrice, subtotal }: PricedLine, items: LockedItems): Omit<NewSaleLine, 'position'> {
  const saleItems = [...lineUsage(line)].map(([menuItemId, units]) => ({ menuItemId, units, unitCost: Number(itemOf(items, menuItemId).unitCost) }));
  const description = describeFlavors(line, (id) => itemOf(items, id).name);
  return { group: line.group, presentationKey: line.presentationKey, promotionId: null, quantity: line.quantity, unitPrice, subtotal, description, items: saleItems };
}
