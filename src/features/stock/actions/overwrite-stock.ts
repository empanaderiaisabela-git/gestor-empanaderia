'use server';

import { type StockOverwriteInput, stockOverwriteSchema } from '@/features/stock/domain/stock.schema';
import { stockService } from '@/features/stock/services/stock.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { afterCatalogChange } from '@/lib/catalog-cache';
import { toActionFailure } from '@/lib/db-errors';
import type { StockMovementResult } from './register-stock-entry';

export async function overwriteStockAction(input: StockOverwriteInput): Promise<ActionResult<StockMovementResult>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = stockOverwriteSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const { item } = await stockService.overwriteStock(caller, parsed.data);
    const stock = Number(item.stock);
    return afterCatalogChange({ success: true, message: `Stock actualizado: ${item.name} queda con ${stock.toLocaleString('es-AR')}`, data: { menuItemId: item.id, stock, version: item.version } });
  } catch (error) {
    return toActionFailure(error, 'el ingreso');
  }
}
