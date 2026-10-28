import type { PriceField } from '@/features/menu/domain/menu-groups';
import { isHalfAndHalf, type OrderLine, presentationOf } from './order-line';

export type Prices = Partial<Record<PriceField, number | null>>;
export type PriceBook = { item(menuItemId: string): Prices | undefined };

export const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

function flavorPrices(line: OrderLine, book: PriceBook, field: PriceField): number[] | null {
  const prices = line.flavors.map((flavor) => book.item(flavor.menuItemId)?.[field] ?? null);
  return prices.every((price): price is number => price !== null) ? prices : null;
}

export function unitLinePrice(line: OrderLine, book: PriceBook): number | null {
  const presentation = presentationOf(line);
  if (!presentation || line.flavors.length === 0) return null;
  const prices = flavorPrices(line, book, presentation.priceField);
  if (!prices) return null;
  if (isHalfAndHalf(presentation)) return Math.max(...prices);
  return round2(line.flavors.reduce((sum, flavor, index) => sum + (flavor.units / presentation.units) * prices[index], 0));
}

export function linePrice(line: OrderLine, book: PriceBook): number | null {
  const unit = unitLinePrice(line, book);
  return unit === null ? null : round2(unit * line.quantity);
}

export function orderTotal(lines: OrderLine[], book: PriceBook): number | null {
  const prices = lines.map((line) => linePrice(line, book));
  return prices.every((price): price is number => price !== null) ? round2(prices.reduce((sum, price) => sum + price, 0)) : null;
}
