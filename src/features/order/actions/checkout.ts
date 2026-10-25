'use server';

import { type CheckoutInput, type CheckoutResult, checkoutSchema } from '@/features/order/domain/checkout.schema';
import { checkoutService } from '@/features/order/services/checkout.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { afterCatalogChange } from '@/lib/catalog-cache';
import { toActionFailure } from '@/lib/db-errors';
import { formatMoney } from '@/lib/format-money';

export async function checkoutAction(input: CheckoutInput): Promise<ActionResult<CheckoutResult>> {
  try {
    const caller = await verifyAuthOrAdmin(false);
    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const result = await checkoutService.checkout(caller, parsed.data);
    return afterCatalogChange({ success: true, message: `Venta registrada por ${formatMoney(result.total)}`, data: result });
  } catch (error) {
    return toActionFailure(error, 'venta');
  }
}
