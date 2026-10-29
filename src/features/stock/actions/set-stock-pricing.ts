'use server';

import { type MenuItemDef, menuItemRowSchema } from '@/features/menu/domain/menu-item.schema';
import { type StockPricingInput, stockPricingSchema } from '@/features/stock/domain/stock.schema';
import { stockService } from '@/features/stock/services/stock.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { afterCatalogChange } from '@/lib/catalog-cache';
import { toActionFailure } from '@/lib/db-errors';

const copiedText = (applied: number): string => (applied === 0 ? '' : `. Precio copiado a ${applied} ${applied === 1 ? 'gusto' : 'gustos'}`);

export async function setStockPricingAction(input: StockPricingInput): Promise<ActionResult<MenuItemDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = stockPricingSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const { item, applied } = await stockService.setPricing(caller, parsed.data);
    return afterCatalogChange({ success: true, message: `Costo y precio guardados: ${item.name}${copiedText(applied)}`, data: menuItemRowSchema.parse(item) });
  } catch (error) {
    return toActionFailure(error, 'el producto');
  }
}
