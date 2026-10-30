import { z } from 'zod';
import { MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import { PAYMENT_TYPES } from './order-validation';

const amount = z.union([z.string(), z.number()]).transform(Number);

export const saleLineRowSchema = z.object({
  group: z.enum(MENU_GROUPS).nullable(),
  presentationKey: z.string().nullable(),
  promotionId: z.uuid().nullable(),
  quantity: z.number(),
  unitPrice: amount,
  subtotal: amount,
  description: z.string(),
});

export const salePaymentRowSchema = z.object({ type: z.enum(PAYMENT_TYPES), amount, cardName: z.string().nullable(), installments: z.number().nullable(), surchargeAmount: amount.nullable() });

export const saleRowSchema = z.object({
  id: z.uuid(),
  createdAt: z.union([z.date(), z.string()]),
  buyerName: z.string().nullable(),
  buyerPhone: z.string().nullable(),
  buyerAddress: z.string().nullable(),
  vendorName: z.string(),
  total: amount,
  discountAmount: amount,
  discountPercentage: amount,
  lines: z.array(saleLineRowSchema),
  payments: z.array(salePaymentRowSchema),
});
export type SaleDef = z.output<typeof saleRowSchema>;
export type SaleLineDef = SaleDef['lines'][number];

export const voidSaleSchema = z.strictObject({ saleId: z.uuid('Elegí una venta válida') });
export type VoidSaleInput = z.infer<typeof voidSaleSchema>;

export const buyerLabel = (buyerName: string | null): string => buyerName?.trim() || 'Sin nombre';
export const buyerContact = ({ buyerPhone, buyerAddress }: Pick<SaleDef, 'buyerPhone' | 'buyerAddress'>): string => [buyerPhone, buyerAddress].filter(Boolean).join(' · ');
