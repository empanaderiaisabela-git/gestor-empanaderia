'use server';

import { type VoidSaleInput, voidSaleSchema } from '@/features/order/domain/sale-history.schema';
import { saleHistoryService } from '@/features/order/services/sale-history.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function voidSaleAction(input: VoidSaleInput): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = voidSaleSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    await saleHistoryService.voidSale(caller, parsed.data.saleId);
    return { success: true, message: 'Venta anulada y stock repuesto.' };
  } catch (error) {
    return toActionFailure(error, 'venta');
  }
}
