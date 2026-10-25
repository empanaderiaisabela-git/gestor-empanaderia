'use server';

import { z } from 'zod';
import { type MenuItemDef, menuItemRowSchema } from '@/features/menu/domain/menu-item.schema';
import { menuItemService } from '@/features/menu/services/menu-item.service';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchMenuItems(): Promise<MenuItemDef[]> {
  try {
    const caller = await verifyAuthOrAdmin(false);
    const items = z.array(menuItemRowSchema).parse(await menuItemService.list());
    return caller.role === 'admin' ? items : items.map((item) => ({ ...item, unitCost: null }));
  } catch (error) {
    console.error('fetchMenuItems error:', error);
    return [];
  }
}
