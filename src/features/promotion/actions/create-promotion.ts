'use server';

import { MESSAGES } from '@/config/messages';
import { type PromotionDef, type PromotionInput, promotionCreateSchema, promotionRowSchema } from '@/features/promotion/domain/promotion.schema';
import { promotionService } from '@/features/promotion/services/promotion.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function createPromotionAction(input: PromotionInput): Promise<ActionResult<PromotionDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = promotionCreateSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const promotion = await promotionService.create(caller, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.CREATED('Promoción'), data: promotionRowSchema.parse(promotion) };
  } catch (error) {
    return toActionFailure(error, 'Promoción');
  }
}
