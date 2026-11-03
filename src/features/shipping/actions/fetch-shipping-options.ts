'use server';

import { z } from 'zod';
import { type ShippingDef, shippingRowSchema } from '@/features/shipping/domain/shipping.schema';
import { shippingService } from '@/features/shipping/services/shipping.service';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchShippingOptions(): Promise<ShippingDef[]> {
  try {
    await verifyAuthOrAdmin(false);
    return z.array(shippingRowSchema).parse(await shippingService.list());
  } catch (error) {
    console.error('fetchShippingOptions error:', error);
    return [];
  }
}
