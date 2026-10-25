import { z } from 'zod';
import { timestampSchema } from './menu-item.schema';

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const BASE64_MAX_LENGTH = Math.ceil(PHOTO_MAX_BYTES / 3) * 4 + 30;
const DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export const uploadMenuPhotoSchema = z.strictObject({
  menuItemId: z.uuid('Elegí un gusto o bebida'),
  image: z.string('Elegí una imagen').max(BASE64_MAX_LENGTH, 'La imagen no puede superar los 5 MB').regex(DATA_URL, 'La imagen tiene que ser JPG, PNG o WEBP'),
});
export type UploadMenuPhotoInput = z.infer<typeof uploadMenuPhotoSchema>;

export const deleteMenuPhotoSchema = z.strictObject({ publicId: z.string('Elegí una foto').min(1, 'Elegí una foto').max(255, 'Elegí una foto') });
export type DeleteMenuPhotoInput = z.infer<typeof deleteMenuPhotoSchema>;

export const menuItemRefSchema = z.uuid();

export const menuPhotoRowSchema = z.object({ publicId: z.string(), url: z.string(), createdAt: timestampSchema });
export type MenuPhotoDef = z.output<typeof menuPhotoRowSchema>;
