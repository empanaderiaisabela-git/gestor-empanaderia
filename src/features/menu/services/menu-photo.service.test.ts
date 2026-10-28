import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeImageStore, type FakeImageStore } from '../testing/fake-menu-photos';
import { createFakeMenuUnitOfWork, type FakeMenuUnitOfWork } from '../testing/fake-menu-unit-of-work';
import { createMenuPhotoService, type MenuPhotoService } from './menu-photo.service';

const ADMIN = { id: '00000000-0000-4000-8000-00000000000a' };
const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const MISSING = '11111111-1111-4111-8111-111111111111';

describe('fotos de los gustos (T-12 CA-1 y BUG-11)', () => {
  let fake: FakeMenuUnitOfWork;
  let store: FakeImageStore;
  let service: MenuPhotoService;
  let itemId: string;

  beforeEach(async () => {
    fake = createFakeMenuUnitOfWork();
    store = createFakeImageStore();
    service = createMenuPhotoService({ unitOfWork: fake, store });
    itemId = (await fake.read.items.insert({ group: 'pizzas', name: 'Muzza', unitCost: 4000, prices: { price1: 11000 } })).id;
  });

  it('sube la foto, la guarda en el gusto y queda en la auditoría', async () => {
    const photo = await service.upload(ADMIN, { menuItemId: itemId, image: PNG });
    expect(photo).toMatchObject({ menuItemId: itemId, publicId: `menu/${itemId}/1` });
    expect(await service.list(itemId)).toHaveLength(1);
    expect(fake.state.audits).toEqual([{ userId: ADMIN.id, action: 'ACTUALIZAR', entity: 'MENU_ITEM', entityId: itemId, detail: { name: 'Muzza', photo: 'Foto agregada' } }]);
  });

  it('un gusto inexistente da NOT_FOUND sin llamar a Cloudinary', async () => {
    await expect(service.upload(ADMIN, { menuItemId: MISSING, image: PNG })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(store.uploaded).toEqual([]);
  });

  it('si falla el guardado, la imagen se borra de Cloudinary', async () => {
    const broken = createMenuPhotoService({ unitOfWork: { ...fake, run: async () => Promise.reject(new Error('se cayó la base')) }, store });
    await expect(broken.upload(ADMIN, { menuItemId: itemId, image: PNG })).rejects.toThrow('se cayó la base');
    expect(store.deleted).toEqual(store.uploaded);
  });

  it('borrar saca la foto de la base y de Cloudinary, y lo audita', async () => {
    const { publicId } = await service.upload(ADMIN, { menuItemId: itemId, image: PNG });
    await service.remove(ADMIN, { publicId });
    expect([await service.list(itemId), store.deleted]).toEqual([[], [publicId]]);
    expect(fake.state.audits.at(-1)).toMatchObject({ detail: { name: 'Muzza', photo: 'Foto eliminada' } });
  });

  it('borrar una foto que ya no está da NOT_FOUND y no toca Cloudinary', async () => {
    await expect(service.remove(ADMIN, { publicId: 'menu/x/9' })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'La foto ya no existe.' });
    expect(store.deleted).toEqual([]);
  });
});
