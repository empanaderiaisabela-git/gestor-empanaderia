'use server';

import { MESSAGES } from '@/config/messages';
import { type ProviderDeleteInput, providerDeleteSchema } from '@/features/provider/domain/provider.schema';
import { providerService } from '@/features/provider/services/provider.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function deleteProviderAction(input: ProviderDeleteInput): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = providerDeleteSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    await providerService.remove(caller, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.DELETED('el proveedor') };
  } catch (error) {
    return toActionFailure(error, 'el proveedor');
  }
}
