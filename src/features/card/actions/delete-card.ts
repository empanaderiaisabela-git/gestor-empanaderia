'use server';

import { MESSAGES } from '@/config/messages';
import { type CardDeleteInput, cardDeleteSchema } from '@/features/card/domain/card.schema';
import { cardService } from '@/features/card/services/card.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function deleteCardAction(input: CardDeleteInput): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = cardDeleteSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    await cardService.remove(caller, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.DELETED('la tarjeta') };
  } catch (error) {
    return toActionFailure(error, 'la tarjeta');
  }
}
