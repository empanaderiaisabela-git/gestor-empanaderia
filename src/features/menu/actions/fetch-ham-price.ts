'use server';

import { type HamPriceDef, hamPriceRowSchema, NO_HAM_PRICE } from '@/features/menu/domain/pizza-extra.schema';
import { pizzaExtraService } from '@/features/menu/services/pizza-extra.service';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchHamPrice(): Promise<HamPriceDef> {
  try {
    await verifyAuthOrAdmin(false);
    return hamPriceRowSchema.parse(await pizzaExtraService.hamPrice());
  } catch (error) {
    console.error('fetchHamPrice error:', error);
    return NO_HAM_PRICE;
  }
}
