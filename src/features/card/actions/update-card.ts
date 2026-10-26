'use server';

import { z } from 'zod';
import { MESSAGES } from '@/config/messages';
import { type CardDef, type CardUpdateInput, cardRowSchema, cardUpdateSchema } from '@/features/card/domain/card.schema';
import { cardService } from '@/features/card/services/card.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function updateCardAction(id: string, input: CardUpdateInput): Promise<ActionResult<CardDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsedId = z.uuid().safeParse(id);
    const parsed = cardUpdateSchema.safeParse(input);
    if (!parsedId.success || !parsed.success) return fail('VALIDATION');
    const card = await cardService.update(caller, parsedId.data, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.UPDATED('Tarjeta'), data: cardRowSchema.parse(card) };
  } catch (error) {
    return toActionFailure(error, 'Tarjeta');
  }
}
