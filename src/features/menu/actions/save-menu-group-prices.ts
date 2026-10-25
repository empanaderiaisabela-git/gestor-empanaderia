'use server';

import { type MenuGroupPriceDef, type MenuGroupPricesInput, menuGroupPriceRowSchema, menuGroupPricesSchema } from '@/features/menu/domain/menu-group-price.schema';
import { menuGroupPriceService } from '@/features/menu/services/menu-group-price.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function saveMenuGroupPricesAction(input: MenuGroupPricesInput): Promise<ActionResult<MenuGroupPriceDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = menuGroupPricesSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const saved = await menuGroupPriceService.save(caller, parsed.data);
    return { success: true, message: 'Precios del grupo guardados exitosamente', data: menuGroupPriceRowSchema.parse(saved) };
  } catch (error) {
    return toActionFailure(error, 'precio del grupo');
  }
}
