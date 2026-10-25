import { z } from 'zod';
import { isValidDecimal } from '@/lib/utils';
import { isPricedByGroup, type MenuGroup, PRICE_FIELDS, type PriceField, priceFieldsOf, priceLabelOf } from './menu-groups';

const MAX_MONEY = 9_999_999.99;

export const priceSchema = z
  .number('Ingresá un precio válido')
  .positive('El precio debe ser mayor a 0')
  .max(MAX_MONEY, 'El precio es demasiado alto')
  .refine((value) => isValidDecimal(value, 2), 'Máximo 2 decimales');

export const unitCostSchema = z
  .number('Ingresá un costo válido')
  .min(0, 'El costo no puede ser negativo')
  .max(MAX_MONEY, 'El costo es demasiado alto')
  .refine((value) => isValidDecimal(value, 2), 'Máximo 2 decimales');

export const menuPricesSchema = z.strictObject({
  price1: priceSchema,
  price3: priceSchema.optional(),
  price6: priceSchema.optional(),
  price12: priceSchema.optional(),
});
export type MenuPrices = z.infer<typeof menuPricesSchema>;

export type PriceIssue = { field: PriceField; message: string };

export function priceIssues(group: MenuGroup, prices: MenuPrices): PriceIssue[] {
  const required = priceFieldsOf(group);
  return PRICE_FIELDS.flatMap((field) => {
    const present = prices[field] !== undefined;
    if (required.includes(field) && !present) return [{ field, message: `Falta el precio de ${priceLabelOf(group, field)}` }];
    if (!required.includes(field) && present) return [{ field, message: 'Este grupo no se vende en esa presentación' }];
    return [];
  });
}

export function itemPriceIssues(group: MenuGroup, prices: MenuPrices | undefined): PriceIssue[] {
  if (isPricedByGroup(group)) return prices === undefined ? [] : [{ field: 'price1', message: 'Este grupo usa el mismo precio para todos los gustos' }];
  if (prices === undefined) return [{ field: 'price1', message: 'Falta el precio del gusto' }];
  return priceIssues(group, prices);
}
