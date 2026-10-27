'use server';

import { type MenuItemVisibilityInput, menuItemVisibilitySchema } from '@/features/menu/domain/menu-item.schema';
import { menuItemService } from '@/features/menu/services/menu-item.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { afterCatalogChange } from '@/lib/catalog-cache';
import { toActionFailure } from '@/lib/db-errors';

export async function toggleMenuItemVisibilityAction(input: MenuItemVisibilityInput): Promise<ActionResult> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = menuItemVisibilitySchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const item = await menuItemService.setVisible(caller, parsed.data);
    return afterCatalogChange({ success: true, message: item.isVisible ? `${item.name} se muestra en el catálogo` : `${item.name} ya no se muestra en el catálogo` });
  } catch (error) {
    return toActionFailure(error, 'el producto');
  }
}
