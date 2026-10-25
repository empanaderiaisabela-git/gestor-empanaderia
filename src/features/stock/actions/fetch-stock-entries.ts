'use server';

import { z } from 'zod';
import { type StockEntryDef, stockEntryRowSchema } from '@/features/stock/domain/stock.schema';
import { stockService } from '@/features/stock/services/stock.service';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchStockEntries(menuItemId: string): Promise<StockEntryDef[]> {
  try {
    const caller = await verifyAuthOrAdmin(false);
    const id = z.uuid().parse(menuItemId);
    const entries = z.array(stockEntryRowSchema).parse(await stockService.entriesOf(id));
    return caller.role === 'admin' ? entries : entries.map((entry) => ({ ...entry, unitCost: null, providerName: null }));
  } catch (error) {
    console.error('fetchStockEntries error:', error);
    return [];
  }
}
