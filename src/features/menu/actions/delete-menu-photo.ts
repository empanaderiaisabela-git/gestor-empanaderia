'use server';

import { type DeleteMenuPhotoInput, deleteMenuPhotoSchema } from '@/features/menu/domain/menu-photo.schema';
import { menuPhotoService } from '@/features/menu/services/menu-photo.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { afterCatalogChange } from '@/lib/catalog-cache';
import { toActionFailure } from '@/lib/db-errors';

export async function deleteMenuPhotoAction(input: DeleteMenuPhotoInput): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = deleteMenuPhotoSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    await menuPhotoService.remove(caller, parsed.data);
    return afterCatalogChange({ success: true, message: 'Foto eliminada' });
  } catch (error) {
    return toActionFailure(error, 'foto');
  }
}
