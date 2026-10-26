import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cloudinaryService } from '@/lib/cloudinary';
import { asUser } from '@/test/as-user';
import { fakeMenu } from '../testing/fake-menu-unit-of-work';
import { uploadMenuPhotoAction } from './upload-menu-photo';

vi.mock('@/features/menu/repository/menu-unit-of-work', async () => {
  const { fakeMenu: fake } = await import('../testing/fake-menu-unit-of-work');
  return { drizzleMenuUnitOfWork: fake };
});
vi.mock('@/lib/cloudinary', async () => {
  const { createFakeImageStore } = await import('../testing/fake-menu-photos');
  return { cloudinaryService: createFakeImageStore() };
});

const MISSING = '11111111-1111-4111-8111-111111111111';
let itemId: string;

describe('subir una foto valida antes de llamar a Cloudinary (BUG-11 CA-1)', () => {
  beforeEach(async () => {
    fakeMenu.reset();
    itemId = (await fakeMenu.read.items.insert({ group: 'pizzas', name: 'Muzza', unitCost: 4000, prices: { price1: 11000 } })).id;
    await asUser({ role: 'admin' });
  });

  it.each([
    { caso: 'un gusto inexistente', input: () => ({ menuItemId: MISSING, image: 'data:image/png;base64,iVBORw0KGgo=' }), expected: { code: 'NOT_FOUND' } },
    { caso: 'un GIF', input: () => ({ menuItemId: itemId, image: 'data:image/gif;base64,R0lGOD==' }), expected: { code: 'VALIDATION', error: 'La imagen tiene que ser JPG, PNG o WEBP' } },
    { caso: 'una URL', input: () => ({ menuItemId: itemId, image: 'https://evil.example/x.png' }), expected: { code: 'VALIDATION', error: 'La imagen tiene que ser JPG, PNG o WEBP' } },
    { caso: 'más de 5 MB', input: () => ({ menuItemId: itemId, image: `data:image/png;base64,${'A'.repeat(7_000_000)}` }), expected: { code: 'VALIDATION', error: 'La imagen no puede superar los 5 MB' } },
  ])('rechaza $caso sin subir nada', async ({ input, expected }) => {
    const upload = vi.spyOn(cloudinaryService, 'uploadImage');
    expect(await uploadMenuPhotoAction(input())).toMatchObject({ success: false, ...expected });
    expect(upload).not.toHaveBeenCalled();
  });
});
