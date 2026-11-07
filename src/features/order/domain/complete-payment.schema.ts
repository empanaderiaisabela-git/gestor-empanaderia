import { z } from 'zod';
import { discountAmountSchema, discountPercentageSchema, paymentsSchema } from './checkout.schema';

export const completePaymentSchema = z.strictObject({
  saleId: z.uuid('Elegí una venta válida'),
  discountPercentage: discountPercentageSchema,
  discountAmount: discountAmountSchema,
  payments: paymentsSchema.min(1, 'Elegí un medio de pago'),
});
export type CompletePaymentInput = z.input<typeof completePaymentSchema>;
export type CompletePaymentData = z.output<typeof completePaymentSchema>;
