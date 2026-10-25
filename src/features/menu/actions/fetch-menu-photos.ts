'use server';

import { z } from 'zod';
import { menuItemRefSchema, type MenuPhotoDef, menuPhotoRowSchema } from '@/features/menu/domain/menu-photo.schema';
import { menuPhotoService } from '@/features/menu/services/menu-photo.service';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchMenuPhotos(menuItemId: string): Promise<MenuPhotoDef[]> {
  try {
    await verifyAuthOrAdmin(true);
    const id = menuItemRefSchema.parse(menuItemId);
    return z.array(menuPhotoRowSchema).parse(await menuPhotoService.list(id));
  } catch (error) {
    console.error('fetchMenuPhotos error:', error);
    return [];
  }
}
