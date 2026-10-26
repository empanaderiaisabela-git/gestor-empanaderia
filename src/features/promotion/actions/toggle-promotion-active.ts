'use server';

import { MESSAGES } from '@/config/messages';
import { type PromotionToggleInput, promotionToggleSchema } from '@/features/promotion/domain/promotion.schema';
import { promotionService } from '@/features/promotion/services/promotion.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function togglePromotionActiveAction(input: PromotionToggleInput): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = promotionToggleSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    await promotionService.setActive(caller, parsed.data);
    const message = parsed.data.isActive ? MESSAGES.SUCCESS.ACTIVATED('Promoción') : MESSAGES.SUCCESS.DEACTIVATED('Promoción');
    return { success: true, message };
  } catch (error) {
    return toActionFailure(error, 'Promoción');
  }
}
