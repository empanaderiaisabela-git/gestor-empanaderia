import { z } from 'zod';
import { MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import { PAYMENT_TYPES } from './order-validation';

const MAX_AMOUNT = 10_000_000;
const MAX_LINES = 50;
const MAX_UNITS = 12;
const MAX_PROMO_PARTS = 100;

const flavorSchema = z.strictObject({
  menuItemId: z.uuid('Elegí un gusto válido'),
  units: z.number('Ingresá las unidades').positive('Las unidades deben ser mayores a 0').max(MAX_UNITS, 'Demasiadas unidades'),
});

const group = z.enum(MENU_GROUPS, 'Elegí un grupo válido');
const presentationKey = z.string('Elegí una presentación').max(10, 'Elegí una presentación');
const flavors = z.array(flavorSchema).min(1, 'Elegí al menos un gusto').max(MAX_UNITS, 'Demasiados gustos');
const quantity = z.number('Ingresá una cantidad').int('La cantidad tiene que ser un número entero').positive('La cantidad debe ser mayor a 0').max(99, 'La cantidad es demasiado grande');

const lineSchema = z.strictObject({ group, presentationKey, flavors, quantity });

const promoLineSchema = z.strictObject({
  promotionId: z.uuid('Elegí una promo válida'),
  quantity,
  parts: z.array(z.strictObject({ group, presentationKey, flavors })).min(1, 'La promo no tiene productos').max(MAX_PROMO_PARTS, 'La promo tiene demasiados productos'),
});

const money = z.number('Ingresá un monto').max(MAX_AMOUNT, 'El monto es demasiado grande');

const paymentSchema = z.strictObject({
  type: z.enum(PAYMENT_TYPES, 'Elegí un medio de pago'),
  amount: money.positive('El monto debe ser mayor a 0'),
});

const distinctTypes = (payments: { type: string }[]): boolean => new Set(payments.map((payment) => payment.type)).size === payments.length;

export const checkoutSchema = z
  .strictObject({
    buyerName: z
      .string('Ingresá un nombre')
      .trim()
      .max(60, 'El nombre es demasiado largo')
      .nullish()
      .transform((value) => value || null),
    lines: z.array(lineSchema).max(MAX_LINES, 'El pedido tiene demasiadas líneas'),
    promos: z.array(promoLineSchema).max(MAX_LINES, 'El pedido tiene demasiadas promos').optional(),
    discountPercentage: z.number('Ingresá un porcentaje').min(0, 'El descuento no puede ser negativo').max(100, 'El descuento no puede superar el 100 %'),
    discountAmount: money.min(0, 'El descuento no puede ser negativo'),
    payments: z.array(paymentSchema).min(1, 'Elegí un medio de pago').max(2, 'Se aceptan hasta 2 medios de pago').refine(distinctTypes, 'Usá medios de pago distintos'),
  })
  .refine((order) => order.lines.length + (order.promos?.length ?? 0) > 0, { message: 'El pedido está vacío', path: ['lines'] });
export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;
export type CheckoutLine = CheckoutData['lines'][number];
export type CheckoutPromo = NonNullable<CheckoutData['promos']>[number];
export type CheckoutResult = { saleId: string; total: number };
