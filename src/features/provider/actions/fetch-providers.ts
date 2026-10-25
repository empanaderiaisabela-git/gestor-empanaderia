'use server';

import { z } from 'zod';
import { type ProviderDef, providerRowSchema } from '@/features/provider/domain/provider.schema';
import { providerService } from '@/features/provider/services/provider.service';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchProviders(): Promise<ProviderDef[]> {
  try {
    await verifyAuthOrAdmin(false);
    return z.array(providerRowSchema).parse(await providerService.list());
  } catch (error) {
    console.error('fetchProviders error:', error);
    return [];
  }
}
