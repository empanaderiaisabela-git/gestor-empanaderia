'use server';

import { db } from '@/lib/db';
import { productImages } from '@/lib/db/schema';
import { cloudinaryService } from '@/lib/cloudinary';
import { ActionResult } from '@/lib/action-result';
import { revalidateCatalog } from '@/lib/catalog-cache';
import { eq } from 'drizzle-orm';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';
import { ConcurrencyError, isAppError } from '@/lib/errors';

export async function deleteProductPhoto(publicId: string): Promise<ActionResult> {
  try {
    await verifyAuthOrAdmin(false);
    if (!publicId) {
      return { success: false, error: 'Public ID is required' };
    }

    // Get the image details to find if it exists
    const image = await db.query.productImages.findFirst({
      where: eq(productImages.publicId, publicId),
    });

    if (!image) {
      throw new ConcurrencyError('La imagen ya fue eliminada o no existe.');
    }

    // Delete from cloudinary
    await cloudinaryService.deleteImage(publicId);

    // Delete from db
    const deleted = await db.delete(productImages).where(eq(productImages.publicId, publicId)).returning();
    
    if (deleted.length === 0) {
      throw new ConcurrencyError('Error de concurrencia al eliminar la imagen.');
    }

    revalidateCatalog();
    return { success: true, data: undefined };
  } catch (error: any) {
    if (isAppError(error)) return toActionFailure(error, 'foto');
    console.error('Error in deleteProductPhoto:', error);
    if (error instanceof ConcurrencyError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'No se pudo eliminar la foto del producto' };
  }
}
