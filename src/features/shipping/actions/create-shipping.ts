'use server';

import { MESSAGES } from '@/config/messages';
import { type ShippingDef, type ShippingInput, shippingCreateSchema, shippingRowSchema } from '@/features/shipping/domain/shipping.schema';
import { shippingService } from '@/features/shipping/services/shipping.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function createShippingAction(input: ShippingInput): Promise<ActionResult<ShippingDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = shippingCreateSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const shipping = await shippingService.create(caller, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.CREATED('el envío'), data: shippingRowSchema.parse(shipping) };
  } catch (error) {
    return toActionFailure(error, 'el envío');
  }
}
