'use server';

import { MESSAGES } from '@/config/messages';
import { type MenuItemDef, type MenuItemInput, menuItemCreateSchema, menuItemRowSchema } from '@/features/menu/domain/menu-item.schema';
import { menuItemService } from '@/features/menu/services/menu-item.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function createMenuItemAction(input: MenuItemInput): Promise<ActionResult<MenuItemDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = menuItemCreateSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const item = await menuItemService.create(caller, parsed.data);
    return { success: true, message: MESSAGES.SUCCESS.CREATED('Producto'), data: menuItemRowSchema.parse(item) };
  } catch (error) {
    return toActionFailure(error, 'producto');
  }
}
