'use server';

import { MESSAGES } from '@/config/messages';
import { type CardToggleInput, cardToggleSchema } from '@/features/card/domain/card.schema';
import { cardService } from '@/features/card/services/card.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function toggleCardActiveAction(input: CardToggleInput): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = cardToggleSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    await cardService.setActive(caller, parsed.data);
    const message = parsed.data.isActive ? MESSAGES.SUCCESS.ACTIVATED('Tarjeta') : MESSAGES.SUCCESS.DEACTIVATED('Tarjeta');
    return { success: true, message };
  } catch (error) {
    return toActionFailure(error, 'Tarjeta');
  }
}
