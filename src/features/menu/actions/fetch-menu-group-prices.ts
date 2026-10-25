'use server';

import { z } from 'zod';
import { type MenuGroupPriceDef, menuGroupPriceRowSchema } from '@/features/menu/domain/menu-group-price.schema';
import { menuGroupPriceService } from '@/features/menu/services/menu-group-price.service';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchMenuGroupPrices(): Promise<MenuGroupPriceDef[]> {
  try {
    await verifyAuthOrAdmin(false);
    return z.array(menuGroupPriceRowSchema).parse(await menuGroupPriceService.list());
  } catch (error) {
    console.error('fetchMenuGroupPrices error:', error);
    return [];
  }
}
