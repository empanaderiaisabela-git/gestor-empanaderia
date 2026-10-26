'use server';

import { MESSAGES } from '@/config/messages';
import { type PromotionDeleteInput, promotionDeleteSchema } from '@/features/promotion/domain/promotion.schema';
import { promotionService } from '@/features/promotion/services/promotion.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function deletePromotionAction(input: PromotionDeleteInput): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = promotionDeleteSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    await promotionService.remove(caller, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.DELETED('Promoción') };
  } catch (error) {
    return toActionFailure(error, 'Promoción');
  }
}
