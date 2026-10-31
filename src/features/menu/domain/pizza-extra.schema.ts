import { z } from 'zod';
import { priceSchema } from './menu-prices';

export const HAM_CODE = 'jamon';
export const HAM_LABEL = 'Jamón extra';
export const HAM_CATEGORY_LABEL = 'Jamón extra para pizza';

export const hamPriceSchema = z.strictObject({ price: priceSchema, version: z.number().int().min(0) });
export type HamPriceInput = z.infer<typeof hamPriceSchema>;

export const hamPriceRowSchema = z.object({ price: z.union([z.string(), z.number()]).transform(Number).nullable(), version: z.number().int().min(0) });
export type HamPriceDef = z.output<typeof hamPriceRowSchema>;

export const NO_HAM_PRICE: HamPriceDef = { price: null, version: 0 };
