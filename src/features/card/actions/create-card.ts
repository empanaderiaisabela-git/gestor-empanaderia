'use server';

import { MESSAGES } from '@/config/messages';
import { type CardDef, type CardInput, cardCreateSchema, cardRowSchema } from '@/features/card/domain/card.schema';
import { cardService } from '@/features/card/services/card.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function createCardAction(input: CardInput): Promise<ActionResult<CardDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = cardCreateSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const card = await cardService.create(caller, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.CREATED('la tarjeta'), data: cardRowSchema.parse(card) };
  } catch (error) {
    return toActionFailure(error, 'la tarjeta');
  }
}
