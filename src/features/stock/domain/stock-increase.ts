import { z } from 'zod';
import { sameFamily, sizeOf } from '@/features/menu/domain/drink';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { round2 } from '@/features/order/domain/order-pricing';

const MAX_PERCENT = 500;
const hundredths = (value: number): boolean => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
const percent = z
  .number('Ingresá un porcentaje')
  .positive('El porcentaje debe ser mayor a 0')
  .max(MAX_PERCENT, `El porcentaje no puede superar el ${MAX_PERCENT} %`)
  .refine(hundredths, 'Hasta 2 decimales')
  .nullable();

export const priceIncreaseSchema = z
  .strictObject({
    menuItemIds: z.array(z.uuid('Elegí productos válidos')).min(1, 'Elegí al menos un producto').max(200, 'Demasiados productos'),
    costPercent: percent,
    pricePercent: percent,
  })
  .refine((input) => input.costPercent !== null || input.pricePercent !== null, { message: 'Cargá al menos un porcentaje', path: ['pricePercent'] });
export type PriceIncreaseInput = z.infer<typeof priceIncreaseSchema>;

export const increased = (value: number, rate: number): number => round2(value * (1 + rate / 100));

export type IncreaseRow = { key: string; label: string; ids: string[] };

export function increaseRowsOf(items: readonly MenuItemDef[]): IncreaseRow[] {
  const rows: IncreaseRow[] = [];
  for (const item of items) {
    const family = rows.find((row) => item.drinkName !== null && items.some((other) => other.id === row.key && sameFamily(other, item)));
    if (family) family.ids.push(item.id);
    else rows.push({ key: item.id, label: item.name, ids: [item.id] });
  }
  return rows.map((row) => {
    const first = items.find((item) => item.id === row.key);
    const amount = first ? sizeOf(first) : null;
    return row.ids.length > 1 && first?.drinkName && amount ? { ...row, label: `${first.drinkName} ${amount} (${row.ids.length} sabores)` } : row;
  });
}
