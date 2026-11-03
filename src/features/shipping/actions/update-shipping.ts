'use server';

import { z } from 'zod';
import { MESSAGES } from '@/config/messages';
import { type ShippingDef, type ShippingUpdateInput, shippingRowSchema, shippingUpdateSchema } from '@/features/shipping/domain/shipping.schema';
import { shippingService } from '@/features/shipping/services/shipping.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function updateShippingAction(id: string, input: ShippingUpdateInput): Promise<ActionResult<ShippingDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsedId = z.uuid().safeParse(id);
    const parsed = shippingUpdateSchema.safeParse(input);
    if (!parsedId.success || !parsed.success) return fail('VALIDATION');
    const shipping = await shippingService.update(caller, parsedId.data, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.UPDATED('el envío'), data: shippingRowSchema.parse(shipping) };
  } catch (error) {
    return toActionFailure(error, 'el envío');
  }
}
