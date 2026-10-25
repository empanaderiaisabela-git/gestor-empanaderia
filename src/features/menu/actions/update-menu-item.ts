'use server';

import { z } from 'zod';
import { MESSAGES } from '@/config/messages';
import { type MenuItemDef, type MenuItemUpdateInput, menuItemRowSchema, menuItemUpdateSchema } from '@/features/menu/domain/menu-item.schema';
import { menuItemService } from '@/features/menu/services/menu-item.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { afterCatalogChange } from '@/lib/catalog-cache';
import { toActionFailure } from '@/lib/db-errors';

export async function updateMenuItemAction(id: string, input: MenuItemUpdateInput): Promise<ActionResult<MenuItemDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsedId = z.uuid().safeParse(id);
    const parsed = menuItemUpdateSchema.safeParse(input);
    if (!parsedId.success || !parsed.success) return fail('VALIDATION');
    const item = await menuItemService.update(caller, parsedId.data, parsed.data);
    return afterCatalogChange({ success: true, message: MESSAGES.SUCCESS.UPDATED('Producto'), data: menuItemRowSchema.parse(item) });
  } catch (error) {
    return toActionFailure(error, 'producto');
  }
}
