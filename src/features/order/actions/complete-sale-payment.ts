'use server';

import type { CheckoutResult } from '@/features/order/domain/checkout.schema';
import { type CompletePaymentInput, completePaymentSchema } from '@/features/order/domain/complete-payment.schema';
import { salePaymentService } from '@/features/order/services/sale-payment.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';
import { formatMoney } from '@/lib/format-money';

export async function completeSalePaymentAction(input: CompletePaymentInput): Promise<ActionResult<CheckoutResult>> {
  try {
    const caller = await verifyAuthOrAdmin(false);
    const parsed = completePaymentSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const result = await salePaymentService.complete(caller, parsed.data);
    return { success: true, message: `Pago completado por ${formatMoney(result.total)}`, data: result };
  } catch (error) {
    return toActionFailure(error, 'la venta');
  }
}
