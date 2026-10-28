import { z } from 'zod';
import { menuPricesSchema, unitCostSchema } from '@/features/menu/domain/menu-prices';

const MAX_QUANTITY = 100_000;

const menuItemId = z.uuid('Elegí un gusto o bebida');

export const stockEntrySchema = z.strictObject({
  menuItemId,
  quantity: z.number('Ingresá una cantidad').int('La cantidad tiene que ser un número entero').positive('La cantidad debe ser mayor a 0').max(MAX_QUANTITY, 'La cantidad es demasiado grande'),
  unitCost: unitCostSchema.optional(),
  prices: menuPricesSchema.optional(),
  providerId: z.uuid('Elegí un proveedor válido').nullable().optional(),
});
export type StockEntryInput = z.infer<typeof stockEntrySchema>;

export const stockLossSchema = z.strictObject({
  menuItemId,
  quantity: z.number('Ingresá una cantidad').int('La cantidad tiene que ser un número entero').positive('La cantidad debe ser mayor a 0').max(MAX_QUANTITY, 'La cantidad es demasiado grande'),
  reason: z.string('Debe especificar un motivo').trim().min(1, 'Debe especificar un motivo').max(255, 'El motivo es demasiado largo'),
});
export type StockLossInput = z.infer<typeof stockLossSchema>;

export const stockPricingSchema = z.strictObject({
  menuItemId,
  version: z.number().int().min(1),
  unitCost: unitCostSchema,
  prices: menuPricesSchema,
  applyToGroup: z.boolean(),
});
export type StockPricingInput = z.infer<typeof stockPricingSchema>;

const amount = z.union([z.string(), z.number()]).transform(Number);

export const stockEntryRowSchema = z.object({
  id: z.uuid(),
  menuItemId: z.uuid(),
  quantity: z.number(),
  unitCost: amount.nullable(),
  providerName: z.string().nullable(),
  username: z.string(),
  createdAt: z.union([z.date(), z.string()]),
});
export type StockEntryDef = z.output<typeof stockEntryRowSchema>;
