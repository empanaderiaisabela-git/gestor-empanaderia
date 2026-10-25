'use server';

import { MESSAGES } from '@/config/messages';
import { type ProviderDef, type ProviderInput, providerCreateSchema, providerRowSchema } from '@/features/provider/domain/provider.schema';
import { providerService } from '@/features/provider/services/provider.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function createProviderAction(input: ProviderInput): Promise<ActionResult<ProviderDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = providerCreateSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const { provider, reactivated } = await providerService.create(caller, parsed.data);
    const message = reactivated ? MESSAGES.SUCCESS.REACTIVATED('Proveedor') : MESSAGES.SUCCESS.CREATED('Proveedor');
    return { success: true, message, data: providerRowSchema.parse(provider) };
  } catch (error) {
    return toActionFailure(error, 'Proveedor');
  }
}
