import { cloudinaryService } from '@/lib/cloudinary';
import { AppError } from '@/lib/errors';
import type { DeleteMenuPhotoInput, UploadMenuPhotoInput } from '@/features/menu/domain/menu-photo.schema';
import type { MenuPhoto } from '@/features/menu/repository/menu-photo.repository';
import { drizzleMenuUnitOfWork, type MenuUnitOfWork } from '@/features/menu/repository/menu-unit-of-work';

type Caller = { id: string };

export type ImageStore = {
  uploadImage(image: string, folderId: string): Promise<{ url: string; publicId: string }>;
  deleteImage(publicId: string): Promise<void>;
};

export type MenuPhotoService = {
  list(menuItemId: string): Promise<MenuPhoto[]>;
  upload(caller: Caller, input: UploadMenuPhotoInput): Promise<MenuPhoto>;
  remove(caller: Caller, input: DeleteMenuPhotoInput): Promise<void>;
};

type Deps = { unitOfWork: MenuUnitOfWork; store: ImageStore };

async function upload({ unitOfWork, store }: Deps, caller: Caller, input: UploadMenuPhotoInput): Promise<MenuPhoto> {
  const item = await unitOfWork.read.items.findById(input.menuItemId);
  if (!item) throw new AppError('NOT_FOUND', { entity: 'producto' });
  const uploaded = await store.uploadImage(input.image, item.id);
  try {
    return await unitOfWork.run(async ({ photos, audit }) => {
      const photo = await photos.insert({ ...uploaded, menuItemId: item.id });
      await audit({ userId: caller.id, action: 'ACTUALIZAR', entity: 'MENU_ITEM', entityId: item.id, detail: { name: item.name, photo: 'Foto agregada' } });
      return photo;
    });
  } catch (error) {
    await store.deleteImage(uploaded.publicId);
    throw error;
  }
}

async function remove({ unitOfWork, store }: Deps, caller: Caller, { publicId }: DeleteMenuPhotoInput): Promise<void> {
  await unitOfWork.run(async ({ photos, items, audit }) => {
    const photo = await photos.find(publicId);
    if (!photo || !(await photos.remove(publicId))) throw new AppError('NOT_FOUND', { entity: 'foto' });
    const item = await items.findById(photo.menuItemId);
    await audit({ userId: caller.id, action: 'ACTUALIZAR', entity: 'MENU_ITEM', entityId: photo.menuItemId, detail: { name: item?.name ?? '', photo: 'Foto eliminada' } });
  });
  await store.deleteImage(publicId);
}

export function createMenuPhotoService(deps: Deps): MenuPhotoService {
  return {
    list: (menuItemId) => deps.unitOfWork.read.photos.listOf(menuItemId),
    upload: (caller, input) => upload(deps, caller, input),
    remove: (caller, input) => remove(deps, caller, input),
  };
}

export const menuPhotoService = createMenuPhotoService({ unitOfWork: drizzleMenuUnitOfWork, store: cloudinaryService });
