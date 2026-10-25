'use server';

import { type StockEntryInput, stockEntrySchema } from '@/features/stock/domain/stock.schema';
import { stockService } from '@/features/stock/services/stock.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export type StockMovementResult = { menuItemId: string; stock: number; version: number };

export async function registerStockEntryAction(input: StockEntryInput): Promise<ActionResult<StockMovementResult>> {
  try {
    const caller = await verifyAuthOrAdmin(false);
    const parsed = stockEntrySchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const setsCost = parsed.data.unitCost !== undefined || Boolean(parsed.data.providerId);
    if (setsCost && caller.role !== 'admin') return fail('FORBIDDEN');
    const { item } = await stockService.registerEntry(caller, parsed.data);
    const stock = Number(item.stock);
    return { success: true, message: `Stock ingresado: ${item.name} queda con ${stock.toLocaleString('es-AR')}`, data: { menuItemId: item.id, stock, version: item.version } };
  } catch (error) {
    return toActionFailure(error, 'producto');
  }
}
