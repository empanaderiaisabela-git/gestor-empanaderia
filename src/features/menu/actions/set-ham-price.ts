'use server';

import { type HamPriceDef, type HamPriceInput, hamPriceRowSchema, hamPriceSchema } from '@/features/menu/domain/pizza-extra.schema';
import { pizzaExtraService } from '@/features/menu/services/pizza-extra.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';
import { formatMoney } from '@/lib/format-money';

export async function setHamPriceAction(input: HamPriceInput): Promise<ActionResult<HamPriceDef>> {
  try {
    const caller = await verifyAuthOrAdmin(true);
    const parsed = hamPriceSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION');
    const saved = hamPriceRowSchema.parse(await pizzaExtraService.setHamPrice(caller, parsed.data));
    return { success: true, message: `Jamón extra: ${formatMoney(parsed.data.price)}`, data: saved };
  } catch (error) {
    return toActionFailure(error, 'el jamón extra');
  }
}
 