'use server';

import { z } from 'zod';
import { type PromotionDef, promotionRowSchema } from '@/features/promotion/domain/promotion.schema';
import { promotionService } from '@/features/promotion/services/promotion.service';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchPromotions(): Promise<PromotionDef[]> {
  try {
    await verifyAuthOrAdmin(false);
    return z.array(promotionRowSchema).parse(await promotionService.list());
  } catch (error) {
    console.error('fetchPromotions error:', error);
    return [];
  }
}
