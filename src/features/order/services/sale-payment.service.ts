import { AppError } from '@/lib/errors';
import type { CheckoutResult } from '@/features/order/domain/checkout.schema';
import type { CompletePaymentData } from '@/features/order/domain/complete-payment.schema';
import { round2 } from '@/features/order/domain/order-pricing';
import { applyDiscount, paymentsCover } from '@/features/order/domain/order-validation';
import { drizzleSalePaymentUnitOfWork, type SalePaymentScope, type SalePaymentUnitOfWork } from '@/features/order/repository/sale-payment-unit-of-work';
import { chargePayments } from './checkout-payments';

type Caller = { id: string };

export type SalePaymentService = {
  complete(caller: Caller, input: CompletePaymentData): Promise<CheckoutResult>;
};

async function complete(scope: SalePaymentScope, caller: Caller, input: CompletePaymentData): Promise<CheckoutResult> {
  const sale = await scope.history.lockSale(input.saleId);
  if (!sale) throw new AppError('NOT_FOUND', { entity: 'la venta' });
  if (sale.payments.length > 0) throw new AppError('STALE_VERSION');
  const { discountPercentage, discountAmount, payments } = input;
  const subtotal = round2(sale.lines.reduce((sum, line) => sum + Number(line.subtotal), 0));
  const food = applyDiscount(subtotal, { percentage: discountPercentage, amount: discountAmount });
  const total = round2(food + Number(sale.shippingAmount));
  if (food < 0 || !paymentsCover(total, payments)) throw new AppError('VALIDATION');
  const charged = await chargePayments(scope, payments);
  await scope.sales.updateTotals(sale.id, { total, discountAmount, discountPercentage });
  await scope.sales.insertPayments(sale.id, charged);
  await scope.audit({ userId: caller.id, action: 'ACTUALIZAR', entity: 'SALE', entityId: sale.id, detail: { total, payments: charged, note: 'Pago completado' } });
  return { saleId: sale.id, total };
}

export function createSalePaymentService({ unitOfWork }: { unitOfWork: SalePaymentUnitOfWork }): SalePaymentService {
  return {
    complete: (caller, input) => unitOfWork.run((scope) => complete(scope, caller, input)),
  };
}

export const salePaymentService = createSalePaymentService({ unitOfWork: drizzleSalePaymentUnitOfWork });
