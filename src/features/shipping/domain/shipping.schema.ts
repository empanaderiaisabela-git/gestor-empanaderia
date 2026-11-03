import { z } from 'zod';
import { amountSchema, timestampSchema } from '@/features/menu/domain/menu-item.schema';
import { isValidDecimal } from '@/lib/utils';

const MAX_MONEY = 9_999_999.99;

const title = z.string('El título es obligatorio').trim().min(1, 'El título es obligatorio').max(60, 'El título no puede superar los 60 caracteres');
const detail = z.string('Escribí el detalle').trim().max(150, 'El detalle no puede superar los 150 caracteres');
const amount = z
  .number('Ingresá un monto válido')
  .min(0, 'El monto no puede ser negativo')
  .max(MAX_MONEY, 'El monto es demasiado alto')
  .refine((value) => isValidDecimal(value, 2), 'Máximo 2 decimales');
const version = z.number().int().min(1);

export const shippingCreateSchema = z.strictObject({ title, detail, amount });
export type ShippingInput = z.infer<typeof shippingCreateSchema>;

export const shippingUpdateSchema = z.strictObject({ title, detail, amount, version });
export type ShippingUpdateInput = z.infer<typeof shippingUpdateSchema>;

export const shippingToggleSchema = z.strictObject({ id: z.uuid(), isActive: z.boolean(), version });
export type ShippingToggleInput = z.infer<typeof shippingToggleSchema>;

export const shippingDeleteSchema = z.strictObject({ id: z.uuid(), version });
export type ShippingDeleteInput = z.infer<typeof shippingDeleteSchema>;

export const shippingRowSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  detail: z.string(),
  amount: amountSchema,
  isActive: z.boolean(),
  version: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type ShippingDef = z.output<typeof shippingRowSchema>;
