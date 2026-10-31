import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import { describeFlavors } from './order-describe';
import { type AddMode, addFlavor, isComplete, type OrderLine, removeFlavor } from './order-line';
import { hamPrice, orderTotal, type PriceBook, round2 } from './order-pricing';

type PartKey = { group: MenuGroup; presentationKey: string };
type Component = PartKey & { quantity: number };
export type PromoSource = { id: string; name: string; price: number; components: readonly Component[] };
export type PromoLine = { id: string; promotionId: string; name: string; price: number; parts: OrderLine[] };
export type PromoAddition = { part: number; menuItemId: string; mode: AddMode };

export function expandComponents(components: readonly Component[]): PartKey[] {
  return components.flatMap(({ group, presentationKey, quantity }) => Array.from({ length: quantity }, () => ({ group, presentationKey })));
}

export function newPromoLine(promotion: PromoSource, id: string = crypto.randomUUID()): PromoLine {
  const parts = expandComponents(promotion.components).map((key, index) => ({ ...key, id: `${id}-${index}`, flavors: [], quantity: 1 }));
  return { id, promotionId: promotion.id, name: promotion.name, price: promotion.price, parts };
}

export const isPromoComplete = (promo: PromoLine): boolean => promo.parts.every(isComplete);

export function firstOpenPart(promo: PromoLine): number | null {
  const index = promo.parts.findIndex((part) => !isComplete(part));
  return index < 0 ? null : index;
}

export function addToPromo(promo: PromoLine, { part, menuItemId, mode }: PromoAddition): PromoLine | null {
  const current = promo.parts[part];
  const next = current && addFlavor(current, menuItemId, mode);
  if (!next) return null;
  return { ...promo, parts: promo.parts.map((existing, index) => (index === part ? next : existing)) };
}

export function removeFromPromo(promo: PromoLine, part: number, menuItemId: string): PromoLine | null {
  const next = promo.parts[part] && removeFlavor(promo.parts[part], menuItemId);
  return next ? { ...promo, parts: promo.parts.map((existing, index) => (index === part ? next : existing)) } : null;
}

export const togglePartHam = (promo: PromoLine, part: number): PromoLine => ({ ...promo, parts: promo.parts.map((existing, index) => (index === part ? { ...existing, ham: !existing.ham } : existing)) });

export const promoUsageLines = (promos: readonly PromoLine[]): OrderLine[] => promos.flatMap((promo) => promo.parts);

export function promoPrice(promo: Pick<PromoLine, 'price' | 'parts'>, book: PriceBook): number | null {
  const hams = promo.parts.map((part) => hamPrice(part, book));
  return hams.every((ham): ham is number => ham !== null) ? round2(hams.reduce((sum, ham) => sum + ham, promo.price)) : null;
}

export function orderSubtotal(lines: OrderLine[], promos: readonly PromoLine[], book: PriceBook): number | null {
  const prices = [orderTotal(lines, book), ...promos.map((promo) => promoPrice(promo, book))];
  return prices.every((price): price is number => price !== null) ? round2(prices.reduce((sum, price) => sum + price, 0)) : null;
}

export function describePromoFlavors(promo: PromoLine, nameOf: (menuItemId: string) => string): string {
  return promo.parts
    .filter((part) => part.flavors.length > 0)
    .map((part) => describeFlavors(part, nameOf))
    .join(' · ');
}
