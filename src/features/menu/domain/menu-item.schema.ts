import { z } from 'zod';
import { DRINK_GROUPS, drinkName, flavor, liters } from './drink';
import { MENU_GROUPS } from './menu-groups';

const name = z.string('El nombre es obligatorio').trim().min(1, 'El nombre es obligatorio').max(60, 'El nombre no puede superar los 60 caracteres');
const version = z.number().int().min(1);

const FOOD_GROUPS = MENU_GROUPS.filter((group) => !DRINK_GROUPS.some((drink) => drink === group));
const drinkFields = { drinkName, liters, flavor: flavor.optional() };

export const foodCreateSchema = z.strictObject({ group: z.enum(FOOD_GROUPS, 'Elegí un grupo válido'), name });
export const drinkCreateSchema = z.strictObject({ group: z.enum(DRINK_GROUPS, 'Elegí un grupo válido'), ...drinkFields });
export const menuItemCreateSchema = z.union([foodCreateSchema, drinkCreateSchema]);
export type MenuItemInput = z.output<typeof menuItemCreateSchema>;

export const foodUpdateSchema = z.strictObject({ name, version });
export const drinkUpdateSchema = z.strictObject({ ...drinkFields, version });
export const menuItemUpdateSchema = z.union([foodUpdateSchema, drinkUpdateSchema]);
export type MenuItemUpdateInput = z.output<typeof menuItemUpdateSchema>;

export const menuItemToggleSchema = z.strictObject({ id: z.uuid(), isActive: z.boolean(), version });
export type MenuItemToggleInput = z.infer<typeof menuItemToggleSchema>;

export const menuItemVisibilitySchema = z.strictObject({ id: z.uuid(), isVisible: z.boolean(), version });
export type MenuItemVisibilityInput = z.infer<typeof menuItemVisibilitySchema>;

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
  isVisible: z.boolean(),
  isBase: z.boolean(),
  minStock: z.number().int().nullable(),
  drinkName: z.string().nullable(),
  liters: amountSchema.nullable(),
  flavor: z.string().nullable(),
  version: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type MenuItemDef = z.output<typeof menuItemRowSchema>;
