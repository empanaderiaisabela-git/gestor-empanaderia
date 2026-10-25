import { z } from 'zod';
import { GROUP_PRICED } from './menu-groups';
import { amountSchema, timestampSchema } from './menu-item.schema';
import { menuPricesSchema, priceIssues } from './menu-prices';

export const menuGroupPricesSchema = z
  .strictObject({ group: z.enum(GROUP_PRICED, 'Este grupo no tiene precio único'), prices: menuPricesSchema, version: z.number().int().min(0) })
  .superRefine((input, ctx) => {
    for (const issue of priceIssues(input.group, input.prices)) {
      ctx.addIssue({ code: 'custom', path: ['prices', issue.field], message: issue.message });
    }
  });
export type MenuGroupPricesInput = z.infer<typeof menuGroupPricesSchema>;

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
