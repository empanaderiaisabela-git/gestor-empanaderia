import { describe, expect, it, vi } from 'vitest';
import { cloudinaryService } from '@/lib/cloudinary';
import { deleteProductPhoto } from './delete-product-photo';
import { getProductPhotos } from './get-product-photos';
import { uploadProductPhoto } from './upload-product-photo';

vi.mock('@/lib/cloudinary', () => ({
  cloudinaryService: { uploadImage: vi.fn(), deleteImage: vi.fn() },
}));

const UNAUTHENTICATED = { success: false, code: 'UNAUTHENTICATED', error: 'No autorizado (Token faltante)' };

describe('regression BUG-1: las acciones de fotos exigen una sesión válida', () => {
  it.each([
    { accion: 'subir una foto', run: () => uploadProductPhoto('producto-1', 'data:image/png;base64,AAAA') },
    { accion: 'borrar una foto', run: () => deleteProductPhoto('products/producto-1/foto') },
    { accion: 'listar las fotos', run: () => getProductPhotos('producto-1') },
  ])('sin sesión, $accion devuelve UNAUTHENTICATED', async ({ run }) => {
    expect(await run()).toEqual(UNAUTHENTICATED);
  });

  it('sin sesión no se sube nada a Cloudinary', async () => {
    await uploadProductPhoto('producto-1', 'data:image/png;base64,AAAA');
    expect(cloudinaryService.uploadImage).not.toHaveBeenCalled();
  });

  it('sin sesión no se borra nada de Cloudinary', async () => {
    await deleteProductPhoto('products/producto-1/foto');
    expect(cloudinaryService.deleteImage).not.toHaveBeenCalled();
  });
});
