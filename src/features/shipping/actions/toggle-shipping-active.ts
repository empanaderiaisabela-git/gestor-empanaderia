'use server';

import { MESSAGES } from '@/config/messages';
import { type ShippingToggleInput, shippingToggleSchema } from '@/features/shipping/domain/shipping.schema';
import { shippingService } from '@/features/shipping/services/shipping.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function toggleShippingActiveAction(input: ShippingToggleInput): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = shippingToggleSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    await shippingService.setActive(caller, parsed.data);
    const message = parsed.data.isActive ? MESSAGES.SUCCESS.ACTIVATED('el envío') : MESSAGES.SUCCESS.DEACTIVATED('el envío');
    return { success: true, message };
  } catch (error) {
    return toActionFailure(error, 'el envío');
  }
}
