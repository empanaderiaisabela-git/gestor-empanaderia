'use server';

import { z } from 'zod';
import { MESSAGES } from '@/config/messages';
import { type PromotionDef, type PromotionUpdateInput, promotionRowSchema, promotionUpdateSchema } from '@/features/promotion/domain/promotion.schema';
import { promotionService } from '@/features/promotion/services/promotion.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function updatePromotionAction(id: string, input: PromotionUpdateInput): Promise<ActionResult<PromotionDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsedId = z.uuid().safeParse(id);
    const parsed = promotionUpdateSchema.safeParse(input);
    if (!parsedId.success || !parsed.success) return fail('VALIDATION');
    const promotion = await promotionService.update(caller, parsedId.data, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.UPDATED('la promoción'), data: promotionRowSchema.parse(promotion) };
  } catch (error) {
    return toActionFailure(error, 'la promoción');
  }
}
