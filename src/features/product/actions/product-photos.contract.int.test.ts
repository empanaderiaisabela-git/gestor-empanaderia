import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { devices, products, providers } from '@/lib/db/schema';
import { asUser } from '@/test/as-user';
import { truncateAll } from '@/test/truncate-all';
import { deleteProductPhoto } from './delete-product-photo';
import { getProductPhotos } from './get-product-photos';
import { uploadProductPhoto } from './upload-product-photo';

vi.mock('@/lib/cloudinary', () => ({
  cloudinaryService: {
    uploadImage: vi.fn(async (_image: string, productId: string) => ({ url: `https://res.cloudinary.com/demo/${productId}.jpg`, publicId: `products/${productId}/foto` })),
    deleteImage: vi.fn(async () => undefined),
  },
}));

async function seedProduct(): Promise<string> {
  const [provider] = await db.insert(providers).values({ name: 'Proveedor de fotos' }).returning({ id: providers.id });
  const [device] = await db.insert(devices).values({ name: 'Categoría de fotos' }).returning({ id: devices.id });
  const [product] = await db.insert(products).values({ deviceId: device.id, providerId: provider.id, purchasePrice: '1.00', salePrice: '2.00' }).returning({ id: products.id });
  return product.id;
}

describe('BUG-1 CA-2: admin y vendedor gestionan las fotos de un producto', () => {
  let productId: string;

  beforeEach(async () => {
    await truncateAll();
    productId = await seedProduct();
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it.each([{ role: 'admin' as const }, { role: 'vendedor' as const }])('$role sube, lista y borra una foto', async ({ role }) => {
    await asUser({ role });
    const uploaded = await uploadProductPhoto(productId, 'data:image/png;base64,AAAA');
    expect(uploaded).toMatchObject({ success: true, data: { url: `https://res.cloudinary.com/demo/${productId}.jpg`, publicId: `products/${productId}/foto` } });

    const listed = await getProductPhotos(productId);
    expect(listed).toMatchObject({ success: true, data: [{ publicId: `products/${productId}/foto` }] });

    expect(await deleteProductPhoto(`products/${productId}/foto`)).toEqual({ success: true, data: undefined });
    expect(await getProductPhotos(productId)).toEqual({ success: true, data: [] });
  });
});
