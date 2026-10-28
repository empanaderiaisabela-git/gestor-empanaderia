'use client';

import { Camera, Trash2 } from 'lucide-react';
import type { ChangeEvent, JSX } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { useMenuPhotos } from './use-menu-photos';

type MenuPhotosModalProps = { item: MenuItemDef | null; onClose: () => void };

export function MenuPhotosModal({ item, onClose }: MenuPhotosModalProps): JSX.Element {
  const { photos, pending, error, upload, remove } = useMenuPhotos(item?.id ?? null);
  const pick = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void upload(file);
  };
  return (
    <ResponsiveModal isOpen={Boolean(item)} onClose={onClose} title={`Fotos · ${item?.name ?? ''}`} icon={<Camera className='w-5 h-5 text-brand-600' />} width='md'>
      <ErrorAlert error={error} />
      <label className='flex items-center justify-center gap-2 h-11 rounded-lg border-2 border-dashed border-brand-300 text-brand-700 dark:text-brand-300 font-semibold cursor-pointer'>
        <Camera className='w-4 h-4' /> {pending ? 'Guardando...' : 'Agregar foto (JPG, PNG o WEBP, hasta 5 MB)'}
        <input type='file' accept='image/jpeg,image/png,image/webp' className='sr-only' onChange={pick} disabled={pending} aria-label='Agregar foto' />
      </label>
      {photos.length === 0 ? (
        <p className='mt-4 text-sm text-zinc-700 dark:text-zinc-200'>Todavía no tiene fotos.</p>
      ) : (
        <ul aria-label='Fotos del producto' className='mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3'>
          {photos.map((photo) => (
            <li key={photo.publicId} className='relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700'>
              <img src={photo.url} alt={`Foto de ${item?.name ?? ''}`} className='w-full aspect-square object-cover' />
              <button onClick={() => void remove(photo.publicId)} disabled={pending} title='Eliminar foto' className='absolute top-1 right-1 p-1.5 rounded-full bg-white/90 text-red-600 shadow'>
                <Trash2 className='w-4 h-4' />
              </button>
            </li>
          ))}
        </ul>
      )}
    </ResponsiveModal>
  );
}
