import { AppError } from '@/lib/errors';
import type { CheckoutPromo } from '@/features/order/domain/checkout.schema';
import { describeFlavors } from '@/features/order/domain/order-describe';
import type { OrderLine } from '@/features/order/domain/order-line';
import { round2 } from '@/features/order/domain/order-pricing';
import { orderUsage } from '@/features/order/domain/order-usage';
import { expandComponents, promoPrice } from '@/features/order/domain/promo-line';
import type { CheckoutScope } from '@/features/order/repository/checkout-unit-of-work';
import type { NewSaleLine } from '@/features/order/repository/sale-writer.repository';
import type { Promotion } from '@/features/promotion/repository/promotion.repository';
import { itemOf, type LockedItems } from './checkout-steps';

export type ResolvedPromo = { promotion: Promotion; quantity: number; parts: OrderLine[] };

function matchesPromotion(parts: CheckoutPromo['parts'], promotion: Promotion): boolean {
  const expected = expandComponents(promotion.components);
  return expected.length === parts.length && expected.every((key, index) => key.group === parts[index].group && key.presentationKey === parts[index].presentationKey);
}

export async function resolvePromos(scope: CheckoutScope, promos: readonly CheckoutPromo[]): Promise<ResolvedPromo[]> {
  const resolved: ResolvedPromo[] = [];
  for (const [index, promo] of promos.entries()) {
    const promotion = await scope.promotions.findById(promo.promotionId);
    if (!promotion?.isActive) throw new AppError('NOT_FOUND', { entity: 'la promoción' });
    if (!matchesPromotion(promo.parts, promotion)) throw new AppError('VALIDATION');
    const parts = promo.parts.map((part, position) => ({ ...part, id: `promo-${index}-${position}`, quantity: promo.quantity }));
    resolved.push({ promotion, quantity: promo.quantity, parts });
  }
  return resolved;
}

function promoUnitPrice({ promotion, parts }: ResolvedPromo, ham: number | null): number {
  const price = promoPrice({ price: Number(promotion.price), parts }, { item: () => undefined, ham });
  if (price === null) throw new AppError('MISSING_PRICE');
  return price;
}

export const promoSubtotal = (promo: ResolvedPromo, ham: number | null): number => round2(promoUnitPrice(promo, ham) * promo.quantity);

export function promoSaleLineOf(promo: ResolvedPromo, items: LockedItems, ham: number | null): Omit<NewSaleLine, 'position'> {
  const saleItems = [...orderUsage(promo.parts)].map(([menuItemId, units]) => ({ menuItemId, units, unitCost: Number(itemOf(items, menuItemId).unitCost) }));
  const flavors = promo.parts.map((part) => describeFlavors(part, (id) => itemOf(items, id).name)).join(' · ');
  const description = `${promo.promotion.name}: ${flavors}`.slice(0, 255);
  return { group: null, presentationKey: null, promotionId: promo.promotion.id, quantity: promo.quantity, unitPrice: promoUnitPrice(promo, ham), subtotal: promoSubtotal(promo, ham), description, items: saleItems };
}
