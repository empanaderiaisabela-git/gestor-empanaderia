'use server';

import { MESSAGES } from '@/config/messages';
import { type ProviderToggleInput, providerToggleSchema } from '@/features/provider/domain/provider.schema';
import { providerService } from '@/features/provider/services/provider.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function toggleProviderActiveAction(input: ProviderToggleInput): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = providerToggleSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    await providerService.setActive(caller, parsed.data);
    const message = parsed.data.isActive ? MESSAGES.SUCCESS.ACTIVATED('el proveedor') : MESSAGES.SUCCESS.DEACTIVATED('el proveedor');
    return { success: true, message };
  } catch (error) {
    return toActionFailure(error, 'el proveedor');
  }
}
