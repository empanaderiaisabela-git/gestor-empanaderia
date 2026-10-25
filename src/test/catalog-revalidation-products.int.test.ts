import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { deleteProductPhoto } from '@/features/product/actions/delete-product-photo';
import { createProductAction, deleteProductAction, registerProductLossAction, toggleProductVisibilityAction, updateProductAction } from '@/features/product/actions/product.actions';
import { uploadProductPhoto } from '@/features/product/actions/upload-product-photo';
import { asUser } from './as-user';
import { type SeededProduct, seedLegacyProduct, seedTestUser } from './seed-legacy-catalog';
import { truncateAll } from './truncate-all';

const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/cloudinary', () => ({
  cloudinaryService: {
    uploadImage: vi.fn(async (_image: string, productId: string) => ({ url: `https://res.cloudinary.com/demo/${productId}.jpg`, publicId: `products/${productId}/foto` })),
    deleteImage: vi.fn(async () => undefined),
  },
}));

async function expectRevalidated(result: Promise<{ success: boolean }>): Promise<void> {
  revalidatePath.mockClear();
  expect(await result).toMatchObject({ success: true });
  expect(revalidatePath).toHaveBeenCalledExactlyOnceWith('/home');
}

describe('T-11 CA-2: las mutaciones de productos invalidan el catálogo', () => {
  let seeded: SeededProduct;

  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('admin');
    seeded = await seedLegacyProduct();
    await asUser({ role: 'admin' });
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('alta, edición, visibilidad, merma y borrado', async () => {
    const { deviceId, providerId, productId } = seeded;
    await expectRevalidated(createProductAction({ deviceId, providerId, description: 'Nueva', purchasePrice: 1, salePrice: 2, stock: 3 }));
    await expectRevalidated(updateProductAction(productId, { salePrice: 3, version: 1 }));
    await expectRevalidated(toggleProductVisibilityAction(productId, false));
    await expectRevalidated(registerProductLossAction(productId, 1, 'Se cayó'));
    const fresh = await seedLegacyProduct();
    await expectRevalidated(deleteProductAction(fresh.productId));
  });

  it('subir y borrar una foto', async () => {
    await expectRevalidated(uploadProductPhoto(seeded.productId, 'data:image/png;base64,AAAA'));
    await expectRevalidated(deleteProductPhoto(`products/${seeded.productId}/foto`));
  });

  it('una mutación rechazada no invalida el catálogo', async () => {
    revalidatePath.mockClear();
    expect(await updateProductAction(seeded.productId, { salePrice: -1, version: 1 })).toMatchObject({ success: false });
    expect(await registerProductLossAction(seeded.productId, 0, 'Nada')).toMatchObject({ success: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
