import { z } from 'zod';
import { formatMoney } from '@/lib/format-money';
import { GROUPS, isPricedByGroup, MENU_GROUPS, type MenuGroup, PRICE_FIELDS } from './menu-groups';
import { priceList, type PriceValues } from './menu-price-list';

export type CatalogPhoto = { publicId: string; url: string };
export type CatalogSource = { id: string; group: MenuGroup; name: string; stock: number; prices: PriceValues; images: CatalogPhoto[] };

export const catalogItemRowSchema = z.object({
  id: z.uuid(),
  group: z.enum(MENU_GROUPS),
  name: z.string(),
  inStock: z.boolean(),
  prices: z.array(z.object({ field: z.enum(PRICE_FIELDS), label: z.string(), value: z.number() })),
  images: z.array(z.object({ publicId: z.string(), url: z.string() })),
});
export type CatalogItemDef = z.output<typeof catalogItemRowSchema>;

export function catalogItemOf(item: CatalogSource, groupPrices: PriceValues | undefined): CatalogItemDef {
  const prices = priceList(item.group, isPricedByGroup(item.group) ? (groupPrices ?? {}) : item.prices);
  return { id: item.id, group: item.group, name: item.name, inStock: item.stock > 0, prices, images: item.images };
}

export function fromPrice(item: Pick<CatalogItemDef, 'prices'>): number | null {
  return item.prices.length === 0 ? null : Math.min(...item.prices.map((price) => price.value));
}

export type CatalogGroupDef = { id: MenuGroup; name: string };

export const CATALOG_GROUPS: readonly CatalogGroupDef[] = MENU_GROUPS.map((group) => ({ id: group, name: GROUPS[group].label }));

export function catalogPriceLabel(item: Pick<CatalogItemDef, 'prices'>): string {
  const from = fromPrice(item);
  if (from === null) return 'Consultar precio';
  return item.prices.length === 1 ? formatMoney(from) : `desde ${formatMoney(from)}`;
}

export function catalogPriceSummary(item: Pick<CatalogItemDef, 'prices'>): string {
  return item.prices.map(({ label, value }) => `${label}: ${formatMoney(value)}`).join(' · ');
}
