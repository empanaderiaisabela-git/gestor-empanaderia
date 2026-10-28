import { AppError } from '@/lib/errors';
import { describeFlavors } from '@/features/order/domain/order-describe';
import type { OrderLine } from '@/features/order/domain/order-line';
import { linePrice, type PriceBook, type Prices, unitLinePrice } from '@/features/order/domain/order-pricing';
import { lineUsage, orderUsage } from '@/features/order/domain/order-usage';
import { isValidLine } from '@/features/order/domain/order-validation';
import type { CheckoutScope } from '@/features/order/repository/checkout-unit-of-work';
import type { NewSaleLine } from '@/features/order/repository/sale-writer.repository';
import type { StockItem } from '@/features/stock/repository/stock.repository';

export type LockedItems = Map<string, StockItem>;
export type PricedLine = { line: OrderLine; unitPrice: number; subtotal: number };
type PriceColumns = Pick<StockItem, 'price1' | 'price3' | 'price6' | 'price12'>;

const amount = (value: string | null): number | null => (value === null ? null : Number(value));
const pricesOf = (row: PriceColumns): Prices => ({ price1: amount(row.price1), price3: amount(row.price3), price6: amount(row.price6), price12: amount(row.price12) });

export function itemOf(items: LockedItems, id: string): StockItem {
  const item = items.get(id);
  if (!item) throw new AppError('NOT_FOUND', { entity: 'el producto' });
  return item;
}

export async function lockFlavors(scope: CheckoutScope, lines: OrderLine[]): Promise<LockedItems> {
  const items: LockedItems = new Map();
  for (const id of [...orderUsage(lines).keys()].sort()) {
    const item = await scope.stock.lockItem(id);
    if (!item) throw new AppError('NOT_FOUND', { entity: 'el producto' });
    items.set(id, item);
  }
  return items;
}

export function assertSellable(lines: OrderLine[], items: LockedItems): void {
  const ofGroup = (line: OrderLine, id: string): boolean => {
    const item = itemOf(items, id);
    return item.isActive && item.group === line.group;
  };
  if (!lines.every((line) => isValidLine(line) && line.flavors.every(({ menuItemId }) => ofGroup(line, menuItemId)))) throw new AppError('VALIDATION');
}

export function priceBookOf(items: LockedItems): PriceBook {
  return {
    item: (id) => {
      const row = items.get(id);
      return row && pricesOf(row);
    },
  };
}

export function priceLine(line: OrderLine, book: PriceBook): PricedLine {
  const unitPrice = unitLinePrice(line, book);
  const subtotal = linePrice(line, book);
  if (unitPrice === null || subtotal === null) throw new AppError('VALIDATION');
  return { line, unitPrice, subtotal };
}

export async function consumeStock(scope: CheckoutScope, items: LockedItems, lines: OrderLine[]): Promise<void> {
  const usage = [...orderUsage(lines)].map(([id, units]) => ({ item: itemOf(items, id), units }));
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
