'use server';

import { z } from 'zod';
import { type CardDef, cardRowSchema } from '@/features/card/domain/card.schema';
import { cardService } from '@/features/card/services/card.service';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchCards(): Promise<CardDef[]> {
  try {
    await verifyAuthOrAdmin(false);
    return z.array(cardRowSchema).parse(await cardService.list());
  } catch (error) {
    console.error('fetchCards error:', error);
    return [];
  }
}
