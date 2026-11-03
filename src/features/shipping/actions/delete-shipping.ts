'use server';

import { MESSAGES } from '@/config/messages';
import { type ShippingDeleteInput, shippingDeleteSchema } from '@/features/shipping/domain/shipping.schema';
import { shippingService } from '@/features/shipping/services/shipping.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function deleteShippingAction(input: ShippingDeleteInput): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = shippingDeleteSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    await shippingService.remove(caller, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.DELETED('el envío') };
  } catch (error) {
    return toActionFailure(error, 'el envío');
  }
}
