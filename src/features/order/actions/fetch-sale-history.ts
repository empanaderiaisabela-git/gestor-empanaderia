'use server';

import { z } from 'zod';
import { type SaleDef, saleRowSchema } from '@/features/order/domain/sale-history.schema';
import { saleHistoryService } from '@/features/order/services/sale-history.service';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchSaleHistory(): Promise<SaleDef[]> {
  try {
    await verifyAuthOrAdmin(false);
    return z.array(saleRowSchema).parse(await saleHistoryService.list());
  } catch (error) {
    console.error('fetchSaleHistory error:', error);
    return [];
  }
}
