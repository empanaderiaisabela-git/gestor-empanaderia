import { AppError } from '@/lib/errors';
import type { CheckoutData, CheckoutResult } from '@/features/order/domain/checkout.schema';
import type { OrderLine } from '@/features/order/domain/order-line';
import { applyDiscount, paymentsCover } from '@/features/order/domain/order-validation';
import { type CheckoutScope, type CheckoutUnitOfWork, drizzleCheckoutUnitOfWork } from '@/features/order/repository/checkout-unit-of-work';
import { assertSellable, consumeStock, lockFlavors, priceBookOf, priceLine, saleLineOf } from './checkout-steps';

type Caller = { id: string };

export type CheckoutService = {
  checkout(caller: Caller, input: CheckoutData): Promise<CheckoutResult>;
};

async function checkout(scope: CheckoutScope, caller: Caller, input: CheckoutData): Promise<CheckoutResult> {
  const lines: OrderLine[] = input.lines.map((line, index) => ({ ...line, id: String(index + 1) }));
  const items = await lockFlavors(scope, lines);
  assertSellable(lines, items);
  const book = priceBookOf(items, await scope.groupPrices.findAll());
  const priced = lines.map((line) => priceLine(line, book));
  const { discountAmount, discountPercentage, buyerName, payments } = input;
  const total = applyDiscount(
    priced.reduce((sum, { subtotal }) => sum + subtotal, 0),
    { percentage: discountPercentage, amount: discountAmount }
  );
  if (total < 0 || !paymentsCover(total, payments)) throw new AppError('VALIDATION');
  await consumeStock(scope, items, lines);
  const saleId = await scope.sales.insertSale({ vendorId: caller.id, buyerName, total, discountAmount, discountPercentage });
  for (const [position, line] of priced.entries()) await scope.sales.insertLine(saleId, { ...saleLineOf(line, items), position });
  await scope.sales.insertPayments(saleId, payments);
  await scope.audit({ userId: caller.id, action: 'CREAR', entity: 'SALE', entityId: saleId, detail: { total, buyerName, lines: priced.length, payments } });
  return { saleId, total };
}

export function createCheckoutService({ unitOfWork }: { unitOfWork: CheckoutUnitOfWork }): CheckoutService {
  return {
    checkout: (caller, input) => unitOfWork.run((scope) => checkout(scope, caller, input)),
  };
}

export const checkoutService = createCheckoutService({ unitOfWork: drizzleCheckoutUnitOfWork });
