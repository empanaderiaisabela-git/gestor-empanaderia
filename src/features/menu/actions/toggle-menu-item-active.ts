'use server';

import { MESSAGES } from '@/config/messages';
import { type MenuItemToggleInput, menuItemToggleSchema } from '@/features/menu/domain/menu-item.schema';
import { menuItemService } from '@/features/menu/services/menu-item.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { afterCatalogChange } from '@/lib/catalog-cache';
import { toActionFailure } from '@/lib/db-errors';

export async function toggleMenuItemActiveAction(input: MenuItemToggleInput): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = menuItemToggleSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    await menuItemService.setActive(caller, parsed.data);
    const message = parsed.data.isActive ? MESSAGES.SUCCESS.ACTIVATED('el producto') : MESSAGES.SUCCESS.DEACTIVATED('el producto');
    return afterCatalogChange({ success: true, message });
  } catch (error) {
    return toActionFailure(error, 'el producto');
  }
}
