import { z } from 'zod';
import { GROUP_PRICED } from './menu-groups';
import { amountSchema, timestampSchema } from './menu-item.schema';

export const menuGroupPriceRowSchema = z.object({
  group: z.enum(GROUP_PRICED),
  price1: amountSchema,
  price3: amountSchema.nullable(),
  price6: amountSchema.nullable(),
  price12: amountSchema.nullable(),
  version: z.number(),
  updatedAt: timestampSchema,
});
export type MenuGroupPriceDef = z.output<typeof menuGroupPriceRowSchema>;
