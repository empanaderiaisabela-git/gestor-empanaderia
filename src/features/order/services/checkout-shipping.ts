import { AppError } from '@/lib/errors';
import type { CheckoutScope } from '@/features/order/repository/checkout-unit-of-work';
import type { NewSale } from '@/features/order/repository/sale-writer.repository';

export type ShippingCharge = Pick<NewSale, 'shippingOptionId' | 'shippingTitle' | 'shippingAmount'>;

const NO_SHIPPING: ShippingCharge = { shippingOptionId: null, shippingTitle: null, shippingAmount: 0 };

export async function shippingOf(scope: CheckoutScope, shippingOptionId: string | null | undefined): Promise<ShippingCharge> {
  if (!shippingOptionId) return NO_SHIPPING;
  const shipping = await scope.shippings.findById(shippingOptionId);
  if (!shipping?.isActive) throw new AppError('NOT_FOUND', { entity: 'el envío' });
  return { shippingOptionId: shipping.id, shippingTitle: shipping.title, shippingAmount: Number(shipping.amount) };
}
