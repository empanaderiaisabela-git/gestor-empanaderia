'use server';

import { MESSAGES } from '@/config/messages';
import { type MenuItemDeleteInput, menuItemDeleteSchema } from '@/features/menu/domain/menu-item.schema';
import { menuItemService } from '@/features/menu/services/menu-item.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { afterCatalogChange } from '@/lib/catalog-cache';
import { toActionFailure } from '@/lib/db-errors';

export async function deleteMenuItemAction(input: MenuItemDeleteInput): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = menuItemDeleteSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    await menuItemService.remove(caller, parsed.data);
    return afterCatalogChange({ success: true, message: MESSAGES.SUCCESS.DELETED('el producto') });
  } catch (error) {
    return toActionFailure(error, 'el producto');
  }
}
