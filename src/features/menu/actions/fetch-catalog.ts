'use server';

import { z } from 'zod';
import { type CatalogItemDef, catalogItemRowSchema } from '@/features/menu/domain/catalog';
import { menuItemRefSchema } from '@/features/menu/domain/menu-photo.schema';
import { catalogService } from '@/features/menu/services/catalog.service';

export async function fetchCatalog(): Promise<CatalogItemDef[]> {
  try {
    return z.array(catalogItemRowSchema).parse(await catalogService.list());
  } catch (error) {
    console.error('fetchCatalog error:', error);
    return [];
  }
}

export async function fetchCatalogItem(id: string): Promise<CatalogItemDef | null> {
  const parsed = menuItemRefSchema.safeParse(id);
  if (!parsed.success) return null;
  try {
    const item = await catalogService.item(parsed.data);
    return item && catalogItemRowSchema.parse(item);
  } catch (error) {
    console.error('fetchCatalogItem error:', error);
    return null;
  }
}
