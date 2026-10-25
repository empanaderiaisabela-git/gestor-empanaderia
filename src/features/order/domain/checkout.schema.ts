import { z } from 'zod';
import { MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import { PAYMENT_TYPES } from './order-validation';

const MAX_AMOUNT = 10_000_000;
const MAX_LINES = 50;
const MAX_UNITS = 12;

const flavorSchema = z.strictObject({
  menuItemId: z.uuid('Elegí un gusto válido'),
  units: z.number('Ingresá las unidades').positive('Las unidades deben ser mayores a 0').max(MAX_UNITS, 'Demasiadas unidades'),
});

const lineSchema = z.strictObject({
  group: z.enum(MENU_GROUPS, 'Elegí un grupo válido'),
  presentationKey: z.string('Elegí una presentación').max(10, 'Elegí una presentación'),
  flavors: z.array(flavorSchema).min(1, 'Elegí al menos un gusto').max(MAX_UNITS, 'Demasiados gustos'),
  quantity: z.number('Ingresá una cantidad').int('La cantidad tiene que ser un número entero').positive('La cantidad debe ser mayor a 0').max(99, 'La cantidad es demasiado grande'),
});

const money = z.number('Ingresá un monto').max(MAX_AMOUNT, 'El monto es demasiado grande');

const paymentSchema = z.strictObject({
  type: z.enum(PAYMENT_TYPES, 'Elegí un medio de pago'),
  amount: money.positive('El monto debe ser mayor a 0'),
});

const distinctTypes = (payments: { type: string }[]): boolean => new Set(payments.map((payment) => payment.type)).size === payments.length;

export const checkoutSchema = z.strictObject({
  buyerName: z
    .string('Ingresá un nombre')
    .trim()
    .max(60, 'El nombre es demasiado largo')
    .nullish()
    .transform((value) => value || null),
  lines: z.array(lineSchema).min(1, 'El pedido está vacío').max(MAX_LINES, 'El pedido tiene demasiadas líneas'),
  discountPercentage: z.number('Ingresá un porcentaje').min(0, 'El descuento no puede ser negativo').max(100, 'El descuento no puede superar el 100 %'),
  discountAmount: money.min(0, 'El descuento no puede ser negativo'),
  payments: z.array(paymentSchema).min(1, 'Elegí un medio de pago').max(2, 'Se aceptan hasta 2 medios de pago').refine(distinctTypes, 'Usá medios de pago distintos'),
});
export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;
export type CheckoutLine = CheckoutData['lines'][number];
export type CheckoutResult = { saleId: string; total: number };
