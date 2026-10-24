'use server';

import { z } from 'zod';
import { MESSAGES } from '@/config/messages';
import { type ProviderDef, type ProviderUpdateInput, providerRowSchema, providerUpdateSchema } from '@/features/provider/domain/provider.schema';
import { providerService } from '@/features/provider/services/provider.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function updateProviderAction(id: string, input: ProviderUpdateInput): Promise<ActionResult<ProviderDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsedId = z.uuid().safeParse(id);
    const parsed = providerUpdateSchema.safeParse(input);
    if (!parsedId.success || !parsed.success) return fail('VALIDATION');
    const provider = await providerService.update(caller, parsedId.data, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.UPDATED('Proveedor'), data: providerRowSchema.parse(provider) };
  } catch (error) {
    return toActionFailure(error, 'Proveedor');
  }
}
