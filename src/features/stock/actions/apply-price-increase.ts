'use server';

import { type PriceIncreaseInput, priceIncreaseSchema } from '@/features/stock/domain/stock-increase';
import type { IncreaseResult } from '@/features/stock/services/stock-increase';
import { stockService } from '@/features/stock/services/stock.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { afterCatalogChange } from '@/lib/catalog-cache';
import { toActionFailure } from '@/lib/db-errors';

export async function applyPriceIncreaseAction(input: PriceIncreaseInput): Promise<ActionResult<IncreaseResult>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = priceIncreaseSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const result = await stockService.applyIncrease(caller, parsed.data);
    return afterCatalogChange({ success: true, message: `Aumento aplicado a ${result.updated} ${result.updated === 1 ? 'producto' : 'productos'}`, data: result });
  } catch (error) {
    return toActionFailure(error, 'el producto');
  }
}
