import { z } from 'zod';
import { MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import { amountSchema, timestampSchema } from '@/features/menu/domain/menu-item.schema';
import { priceSchema } from '@/features/menu/domain/menu-prices';
import { presentationOf } from '@/features/order/domain/order-line';

export const MAX_COMPONENTS = 10;

const name = z.string('El nombre es obligatorio').trim().min(1, 'El nombre es obligatorio').max(60, 'El nombre no puede superar los 60 caracteres');
const version = z.number().int().min(1);
const quantity = z.number('Ingresá una cantidad válida').int('La cantidad debe ser un número entero').min(1, 'La cantidad debe ser al menos 1').max(99, 'La cantidad no puede superar 99');

export const promotionComponentSchema = z
  .strictObject({ group: z.enum(MENU_GROUPS, 'Elegí un grupo válido'), presentationKey: z.string().max(10), quantity })
  .refine((component) => presentationOf(component) !== null, { message: 'Ese grupo no se vende en esa presentación', path: ['presentationKey'] });
export type PromotionComponent = z.infer<typeof promotionComponentSchema>;

const keyOf = ({ group, presentationKey }: PromotionComponent): string => `${group}:${presentationKey}`;

const components = z
  .array(promotionComponentSchema)
  .min(1, 'Agregá al menos un producto')
  .max(MAX_COMPONENTS, `Una promo puede tener hasta ${MAX_COMPONENTS} productos`)
  .refine((list) => new Set(list.map(keyOf)).size === list.length, 'Ese producto ya está en la promo: sumá la cantidad');

export const promotionCreateSchema = z.strictObject({ name, price: priceSchema, components });
export type PromotionInput = z.infer<typeof promotionCreateSchema>;

export const promotionUpdateSchema = z.strictObject({ name, price: priceSchema, components, version });
export type PromotionUpdateInput = z.infer<typeof promotionUpdateSchema>;

export const promotionToggleSchema = z.strictObject({ id: z.uuid(), isActive: z.boolean(), version });
export type PromotionToggleInput = z.infer<typeof promotionToggleSchema>;

export const promotionDeleteSchema = z.strictObject({ id: z.uuid(), version });
export type PromotionDeleteInput = z.infer<typeof promotionDeleteSchema>;

export const promotionRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  price: amountSchema,
  isActive: z.boolean(),
  version: z.number(),
  components: z.array(z.object({ group: z.enum(MENU_GROUPS), presentationKey: z.string(), quantity: z.number() })),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type PromotionDef = z.output<typeof promotionRowSchema>;
