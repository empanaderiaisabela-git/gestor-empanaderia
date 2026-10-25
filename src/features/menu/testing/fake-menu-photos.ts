import type { MenuPhoto, MenuPhotoRepository } from '@/features/menu/repository/menu-photo.repository';

export type FakePhotoState = { photos: MenuPhoto[] };

export function fakeMenuPhotoRepository(state: FakePhotoState): MenuPhotoRepository {
  const byAge = (a: MenuPhoto, b: MenuPhoto): number => a.createdAt.getTime() - b.createdAt.getTime();
  return {
    listOf: async (menuItemId) => state.photos.filter((photo) => photo.menuItemId === menuItemId).sort((a, b) => byAge(b, a)),
    ofItems: async (menuItemIds) => state.photos.filter((photo) => menuItemIds.includes(photo.menuItemId)).sort(byAge),
    find: async (publicId) => state.photos.find((photo) => photo.publicId === publicId) ?? null,
    insert: async (photo) => {
      const row: MenuPhoto = { ...photo, createdAt: new Date(state.photos.length * 1000) };
      state.photos.push(row);
      return { ...row };
    },
    remove: async (publicId) => {
      const before = state.photos.length;
      state.photos = state.photos.filter((photo) => photo.publicId !== publicId);
      return state.photos.length < before;
    },
  };
}

export type FakeImageStore = {
  uploaded: string[];
  deleted: string[];
  failUpload: boolean;
  uploadImage(image: string, folderId: string): Promise<{ url: string; publicId: string }>;
  deleteImage(publicId: string): Promise<void>;
};

export function createFakeImageStore(): FakeImageStore {
  const store: FakeImageStore = {
    uploaded: [],
    deleted: [],
    failUpload: false,
    uploadImage: async (_image, folderId) => {
      if (store.failUpload) throw new Error('Cloudinary no responde');
      const publicId = `menu/${folderId}/${store.uploaded.length + 1}`;
      store.uploaded.push(publicId);
      return { publicId, url: `https://fotos.test/${publicId}.webp` };
    },
    deleteImage: async (publicId) => void store.deleted.push(publicId),
  };
  return store;
}
