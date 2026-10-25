import fc from 'fast-check';
import { revalidatePath } from 'next/cache';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { cookieJar } from '@/test/cookie-jar';
import { fakeMenu } from '../testing/fake-menu-unit-of-work';
import { deleteMenuPhotoAction } from './delete-menu-photo';
import { fetchCatalog, fetchCatalogItem } from './fetch-catalog';
import { fetchMenuPhotos } from './fetch-menu-photos';
import { toggleMenuItemVisibilityAction } from './toggle-menu-item-visibility';
import { uploadMenuPhotoAction } from './upload-menu-photo';

vi.mock('@/features/menu/repository/menu-unit-of-work', async () => {
  const { fakeMenu: fake } = await import('../testing/fake-menu-unit-of-work');
  return { drizzleMenuUnitOfWork: fake };
});
vi.mock('@/lib/cloudinary', async () => {
  const { createFakeImageStore } = await import('../testing/fake-menu-photos');
  return { cloudinaryService: createFakeImageStore() };
});

const PNG = 'data:image/png;base64,iVBORw0KGgo=';
let itemId: string;

describe('fotos, visibilidad y catálogo público (T-12)', () => {
  beforeEach(async () => {
    fakeMenu.reset();
    itemId = (await fakeMenu.read.items.insert({ group: 'pizzas', name: 'Muzza', unitCost: 4000, prices: { price1: 11000 } })).id;
    vi.mocked(revalidatePath).mockClear();
    await asUser({ role: 'admin' });
  });

  it('el admin muestra el gusto en el catálogo y le sube una foto; el catálogo se regenera', async () => {
    expect(await toggleMenuItemVisibilityAction({ id: itemId, isVisible: true, version: 1 })).toEqual({ success: true, message: 'Muzza se muestra en el catálogo' });
    expect(await uploadMenuPhotoAction({ menuItemId: itemId, image: PNG })).toMatchObject({ success: true, message: 'Foto agregada', data: { url: expect.stringContaining(`menu/${itemId}/`) } });
    expect(revalidatePath).toHaveBeenCalledTimes(2);
    expect(await fetchMenuPhotos(itemId)).toHaveLength(1);
    cookieJar.clear();
    expect(await fetchCatalog()).toMatchObject([{ name: 'Muzza', prices: [{ value: 11000 }], images: [{ url: expect.stringContaining(itemId) }] }]);
    expect(await fetchCatalogItem(itemId)).toMatchObject({ name: 'Muzza' });
  });

  it('ocultarlo lo saca del catálogo público', async () => {
    await toggleMenuItemVisibilityAction({ id: itemId, isVisible: true, version: 1 });
    expect(await toggleMenuItemVisibilityAction({ id: itemId, isVisible: false, version: 2 })).toEqual({ success: true, message: 'Muzza ya no se muestra en el catálogo' });
    expect([await fetchCatalog(), await fetchCatalogItem(itemId), await fetchCatalogItem('x')]).toEqual([[], null, null]);
  });

  it('FORBIDDEN: el vendedor no maneja fotos ni visibilidad', async () => {
    await asUser({ role: 'vendedor' });
    expect(await uploadMenuPhotoAction({ menuItemId: itemId, image: PNG })).toMatchObject({ code: 'FORBIDDEN' });
    expect(await deleteMenuPhotoAction({ publicId: 'x' })).toMatchObject({ code: 'FORBIDDEN' });
    expect(await toggleMenuItemVisibilityAction({ id: itemId, isVisible: true, version: 1 })).toMatchObject({ code: 'FORBIDDEN' });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await fetchMenuPhotos(itemId)).toEqual([]);
  });

  it.each([
    { caso: 'VALIDATION: tipo no permitido', run: () => uploadMenuPhotoAction({ menuItemId: itemId, image: 'data:image/gif;base64,R0lGOD==' }), expected: { success: false, code: 'VALIDATION', error: 'La imagen tiene que ser JPG, PNG o WEBP' } },
    { caso: 'NOT_FOUND: borrar una foto inexistente', run: () => deleteMenuPhotoAction({ publicId: 'menu/x/9' }), expected: { success: false, code: 'NOT_FOUND', error: 'El/la foto seleccionado ya no existe.' } },
    { caso: 'STALE_VERSION: visibilidad con versión vieja', run: () => toggleMenuItemVisibilityAction({ id: itemId, isVisible: true, version: 7 }), expected: { success: false, code: 'STALE_VERSION' } },
  ])('$caso', async ({ run, expected }) => {
    expect(await run()).toMatchObject(expected);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('borrar una foto la saca del gusto', async () => {
    const uploaded = await uploadMenuPhotoAction({ menuItemId: itemId, image: PNG });
    const publicId = uploaded.success ? uploaded.data.publicId : '';
    expect(await deleteMenuPhotoAction({ publicId })).toEqual({ success: true, message: 'Foto eliminada' });
    expect(await fetchMenuPhotos(itemId)).toEqual([]);
  });

  it('fuzz: ninguna entrada hace lanzar ni devuelve un error fuera del catálogo', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(uploadMenuPhotoAction, undefined, [input]);
        expect(result.success).toBe(false);
        expect(['VALIDATION', 'NOT_FOUND']).toContain(result.code);
      }),
      { numRuns: 100 }
    );
  });
});
