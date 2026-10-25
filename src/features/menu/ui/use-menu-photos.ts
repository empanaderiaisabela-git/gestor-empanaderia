import { useCallback, useEffect, useState } from 'react';
import { deleteMenuPhotoAction } from '@/features/menu/actions/delete-menu-photo';
import { fetchMenuPhotos } from '@/features/menu/actions/fetch-menu-photos';
import { uploadMenuPhotoAction } from '@/features/menu/actions/upload-menu-photo';
import type { MenuPhotoDef } from '@/features/menu/domain/menu-photo.schema';

export type MenuPhotosModel = {
  photos: MenuPhotoDef[];
  pending: boolean;
  error: string | null;
  upload: (file: File) => Promise<void>;
  remove: (publicId: string) => Promise<void>;
};

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export function useMenuPhotos(menuItemId: string | null): MenuPhotosModel {
  const [photos, setPhotos] = useState<MenuPhotoDef[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async (): Promise<void> => setPhotos(menuItemId ? await fetchMenuPhotos(menuItemId) : []), [menuItemId]);

  useEffect(() => {
    setError(null);
    void reload();
  }, [reload]);

  const run = async (work: () => Promise<{ success: boolean; error?: string }>): Promise<void> => {
    setPending(true);
    const result = await work();
    setError(result.success ? null : (result.error ?? 'No se pudo guardar la foto'));
    if (result.success) await reload();
    setPending(false);
  };

  const upload = async (file: File): Promise<void> => {
    if (!menuItemId) return;
    const image = await readAsDataUrl(file).catch(() => '');
    await run(() => uploadMenuPhotoAction({ menuItemId, image }));
  };

  return { photos, pending, error, upload, remove: (publicId) => run(() => deleteMenuPhotoAction({ publicId })) };
}
