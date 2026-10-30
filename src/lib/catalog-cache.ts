import { revalidatePath } from 'next/cache';
import { isCatalogPublic } from './public-catalog';

export const CATALOG_PATH = '/home';

export function revalidateCatalog(): void {
  if (isCatalogPublic()) revalidatePath(CATALOG_PATH);
}

export function afterCatalogChange<T extends { success: boolean }>(result: T): T {
  if (result.success) revalidateCatalog();
  return result;
}
