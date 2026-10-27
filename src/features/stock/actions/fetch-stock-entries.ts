'use server';

import { z } from 'zod';
import { type StockEntryDef, stockEntryRowSchema } from '@/features/stock/domain/stock.schema';
import { stockService } from '@/features/stock/services/stock.service';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchStockEntries(menuItemId: string): Promise<StockEntryDef[]> {
  try {
    await verifyAuthOrAdmin(true);
    const id = z.uuid().parse(menuItemId);
    return z.array(stockEntryRowSchema).parse(await stockService.entriesOf(id));
  } catch (error) {
    console.error('fetchStockEntries error:', error);
    return [];
  }
}
