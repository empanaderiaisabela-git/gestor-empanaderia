import { z } from 'zod';
import { MENU_GROUPS } from './menu-groups';
import { itemPriceIssues, menuPricesSchema, unitCostSchema } from './menu-prices';

const name = z.string('El nombre es obligatorio').trim().min(1, 'El nombre es obligatorio').max(60, 'El nombre no puede superar los 60 caracteres');
const version = z.number().int().min(1);

export const menuItemCreateSchema = z
  .strictObject({ group: z.enum(MENU_GROUPS, 'Elegí un grupo válido'), name, unitCost: unitCostSchema, prices: menuPricesSchema.optional() })
  .superRefine((input, ctx) => {
    for (const issue of itemPriceIssues(input.group, input.prices)) {
      ctx.addIssue({ code: 'custom', path: ['prices', issue.field], message: issue.message });
    }
  });
export type MenuItemInput = z.infer<typeof menuItemCreateSchema>;

export const menuItemUpdateSchema = z.strictObject({ name, unitCost: unitCostSchema, prices: menuPricesSchema.optional(), version });
export type MenuItemUpdateInput = z.infer<typeof menuItemUpdateSchema>;

export const menuItemToggleSchema = z.strictObject({ id: z.uuid(), isActive: z.boolean(), version });
export type MenuItemToggleInput = z.infer<typeof menuItemToggleSchema>;

export const menuItemDeleteSchema = z.strictObject({ id: z.uuid(), version });
export type MenuItemDeleteInput = z.infer<typeof menuItemDeleteSchema>;

export const amountSchema = z.union([z.string(), z.number()]).transform(Number);
export const timestampSchema = z.union([z.date(), z.string()]);

export const menuItemRowSchema = z.object({
  id: z.uuid(),
  group: z.enum(MENU_GROUPS),
  name: z.string(),
  unitCost: amountSchema.nullable(),
  stock: amountSchema,
  price1: amountSchema.nullable(),
  price3: amountSchema.nullable(),
  price6: amountSchema.nullable(),
  price12: amountSchema.nullable(),
  isActive: z.boolean(),
  version: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type MenuItemDef = z.output<typeof menuItemRowSchema>;
