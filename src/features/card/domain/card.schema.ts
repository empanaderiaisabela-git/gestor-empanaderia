import { z } from 'zod';
import { amountSchema, timestampSchema } from '@/features/menu/domain/menu-item.schema';
import { isValidDecimal } from '@/lib/utils';

export const INSTALLMENTS = [1, 3, 6, 12] as const;
export type Installments = (typeof INSTALLMENTS)[number];

const name = z.string('El nombre es obligatorio').trim().min(1, 'El nombre es obligatorio').max(40, 'El nombre no puede superar los 40 caracteres');
const version = z.number().int().min(1);

const installments = z.number('Elegí 1, 3, 6 o 12 cuotas').refine((value) => INSTALLMENTS.some((allowed) => allowed === value), 'Elegí 1, 3, 6 o 12 cuotas');
const surchargePct = z
  .number('Ingresá un recargo válido')
  .min(0, 'El recargo va de 0 a 100 %')
  .max(100, 'El recargo va de 0 a 100 %')
  .refine((value) => isValidDecimal(value, 2), 'Máximo 2 decimales');

export const cardPlanSchema = z.strictObject({ installments, surchargePct });
export type CardPlan = z.infer<typeof cardPlanSchema>;

const plans = z
  .array(cardPlanSchema)
  .min(1, 'Agregá al menos un plan de cuotas')
  .max(INSTALLMENTS.length, 'Hay más planes que cuotas posibles')
  .refine((list) => new Set(list.map((plan) => plan.installments)).size === list.length, 'Esas cuotas ya están en la tarjeta');

export const cardCreateSchema = z.strictObject({ name, plans });
export type CardInput = z.infer<typeof cardCreateSchema>;

export const cardUpdateSchema = z.strictObject({ name, plans, version });
export type CardUpdateInput = z.infer<typeof cardUpdateSchema>;

export const cardToggleSchema = z.strictObject({ id: z.uuid(), isActive: z.boolean(), version });
export type CardToggleInput = z.infer<typeof cardToggleSchema>;

export const cardDeleteSchema = z.strictObject({ id: z.uuid(), version });
export type CardDeleteInput = z.infer<typeof cardDeleteSchema>;

export const cardRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  isActive: z.boolean(),
  version: z.number(),
  plans: z.array(z.object({ installments: z.number(), surchargePct: amountSchema })),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type CardDef = z.output<typeof cardRowSchema>;
