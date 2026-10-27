import { formatMoney } from '@/lib/format-money';
import { type MenuGroup, type PriceField, priceFieldsOf, priceLabelOf } from './menu-groups';

export type PriceRow = { field: PriceField; label: string; value: number };
export type PriceValues = Partial<Record<PriceField, number | null>>;

export function priceList(group: MenuGroup, prices: PriceValues): PriceRow[] {
  return priceFieldsOf(group).flatMap((field) => {
    const value = prices[field];
    return value === null || value === undefined ? [] : [{ field, label: priceLabelOf(group, field), value }];
  });
}

export function priceSummary(group: MenuGroup, prices: PriceValues): string {
  return priceList(group, prices)
    .map(({ label, value }) => `${label}: ${formatMoney(value)}`)
    .join(' · ');
}
