import { AppError } from '@/lib/errors';
import type { CheckoutData, CheckoutResult } from '@/features/order/domain/checkout.schema';
import type { OrderLine } from '@/features/order/domain/order-line';
import { round2 } from '@/features/order/domain/order-pricing';
import { applyDiscount, paymentsCover } from '@/features/order/domain/order-validation';
import { type CheckoutScope, type CheckoutUnitOfWork, drizzleCheckoutUnitOfWork } from '@/features/order/repository/checkout-unit-of-work';
import { customerFor } from './checkout-customer';
import { chargePayments } from './checkout-payments';
import { promoSaleLineOf, promoSubtotal, resolvePromos } from './checkout-promos';
import { assertSellable, consumeStock, lockFlavors, priceBookOf, priceLine, saleLineOf } from './checkout-steps';

type Caller = { id: string };

export type CheckoutService = {
  checkout(caller: Caller, input: CheckoutData): Promise<CheckoutResult>;
};

async function checkout(scope: CheckoutScope, caller: Caller, input: CheckoutData): Promise<CheckoutResult> {
  const lines: OrderLine[] = input.lines.map((line, index) => ({ ...line, id: String(index + 1) }));
  const promos = await resolvePromos(scope, input.promos ?? []);
  const sold = [...lines, ...promos.flatMap((promo) => promo.parts)];
  const items = await lockFlavors(scope, sold);
  assertSellable(sold, items);
  const book = priceBookOf(items);
  const priced = lines.map((line) => priceLine(line, book));
  const { discountAmount, discountPercentage, buyer, payments } = input;
  const subtotal = round2([...priced.map((line) => line.subtotal), ...promos.map(promoSubtotal)].reduce((sum, value) => sum + value, 0));
  const total = applyDiscount(subtotal, { percentage: discountPercentage, amount: discountAmount });
  if (total < 0 || !paymentsCover(total, payments)) throw new AppError('VALIDATION');
  const charged = await chargePayments(scope, payments);
  await consumeStock(scope, items, sold);
  const customerId = await customerFor(scope, caller.id, buyer);
  const saleId = await scope.sales.insertSale({ vendorId: caller.id, customerId, buyerName: buyer.name, buyerPhone: buyer.phone || null, buyerAddress: buyer.address || null, total, discountAmount, discountPercentage });
  const saleLines = [...priced.map((line) => saleLineOf(line, items)), ...promos.map((promo) => promoSaleLineOf(promo, items))];
  for (const [position, line] of saleLines.entries()) await scope.sales.insertLine(saleId, { ...line, position });
  await scope.sales.insertPayments(saleId, charged);
  await scope.audit({ userId: caller.id, action: 'CREAR', entity: 'SALE', entityId: saleId, detail: { total, buyerName: buyer.name, lines: saleLines.length, payments: charged } });
  return { saleId, total };
}

export function createCheckoutService({ unitOfWork }: { unitOfWork: CheckoutUnitOfWork }): CheckoutService {
  return {
    checkout: (caller, input) => unitOfWork.run((scope) => checkout(scope, caller, input)),
  };
}

export const checkoutService = createCheckoutService({ unitOfWork: drizzleCheckoutUnitOfWork });
