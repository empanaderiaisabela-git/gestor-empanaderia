'use server';

import { type MenuPhotoDef, menuPhotoRowSchema, type UploadMenuPhotoInput, uploadMenuPhotoSchema } from '@/features/menu/domain/menu-photo.schema';
import { menuPhotoService } from '@/features/menu/services/menu-photo.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { afterCatalogChange } from '@/lib/catalog-cache';
import { toActionFailure } from '@/lib/db-errors';

export async function uploadMenuPhotoAction(input: UploadMenuPhotoInput): Promise<ActionResult<MenuPhotoDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = uploadMenuPhotoSchema.safeParse(input);
    if (!parsed.success) return { success: false, code: 'VALIDATION', error: parsed.error.issues[0]?.message ?? fail('VALIDATION').error };
    const photo = menuPhotoRowSchema.parse(await menuPhotoService.upload(caller, parsed.data));
    return afterCatalogChange({ success: true, message: 'Foto agregada', data: photo });
  } catch (error) {
    return toActionFailure(error, 'la foto');
  }
}
