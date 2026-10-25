import { asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { menuItemImages } from '@/lib/db/menu-schema';
import type { DbTransaction } from '@/lib/db/transaction';

export type MenuPhoto = typeof menuItemImages.$inferSelect;
export type NewMenuPhoto = { publicId: string; url: string; menuItemId: string };

export type MenuPhotoRepository = {
  listOf(menuItemId: string): Promise<MenuPhoto[]>;
  ofItems(menuItemIds: string[]): Promise<MenuPhoto[]>;
  find(publicId: string): Promise<MenuPhoto | null>;
  insert(photo: NewMenuPhoto): Promise<MenuPhoto>;
  remove(publicId: string): Promise<boolean>;
};

type Executor = typeof db | DbTransaction;

export function drizzleMenuPhotoRepository(executor: Executor = db): MenuPhotoRepository {
  return {
    listOf: (menuItemId) => executor.select().from(menuItemImages).where(eq(menuItemImages.menuItemId, menuItemId)).orderBy(desc(menuItemImages.createdAt)),
    ofItems: async (menuItemIds) => (menuItemIds.length === 0 ? [] : executor.select().from(menuItemImages).where(inArray(menuItemImages.menuItemId, menuItemIds)).orderBy(asc(menuItemImages.createdAt))),
    find: async (publicId) => (await executor.select().from(menuItemImages).where(eq(menuItemImages.publicId, publicId)))[0] ?? null,
    insert: async (photo) => (await executor.insert(menuItemImages).values(photo).returning())[0],
    remove: async (publicId) => (await executor.delete(menuItemImages).where(eq(menuItemImages.publicId, publicId)).returning({ publicId: menuItemImages.publicId })).length > 0,
  };
}
