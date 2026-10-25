import { revalidatePath } from 'next/cache';

export const CATALOG_PATH = '/home';

export function revalidateCatalog(): void {
  revalidatePath(CATALOG_PATH);
}

export function afterCatalogChange<T extends { success: boolean }>(result: T): T {
  if (result.success) revalidateCatalog();
  return result;
}
