import { round2 } from '@/features/order/domain/order-pricing';
import { applyDiscount, type Discount, type Payment, type PaymentType, paymentsCover } from '@/features/order/domain/order-validation';

export type CheckoutForm = { percentage: string; amount: string; methods: PaymentType[]; split: string };
export type CheckoutCheck = { total: number; payments: Payment[]; discount: Discount; error: string | null };

export const BLANK_CHECKOUT: CheckoutForm = { percentage: '', amount: '', methods: ['efectivo'], split: '' };

const numberOf = (text: string): number => (text.trim() === '' ? 0 : Number(text.replace(',', '.')));

export function toggleMethod(methods: PaymentType[], type: PaymentType): PaymentType[] {
  if (methods.includes(type)) return methods.filter((method) => method !== type);
  return [...methods, type].slice(-2);
}

export function paymentsOf(total: number, { methods, split }: CheckoutForm): Payment[] {
  const [first, second] = methods;
  if (!first) return [];
  if (!second) return [{ type: first, amount: total }];
  const amount = numberOf(split);
  return [
    { type: first, amount },
    { type: second, amount: round2(total - amount) },
  ];
}

function errorOf(total: number, discount: Discount, payments: Payment[]): string | null {
  if (!(discount.percentage >= 0 && discount.percentage <= 100)) return 'El descuento va de 0 a 100 %';
  if (!(discount.amount >= 0)) return 'El descuento no puede ser negativo';
  if (total <= 0) return 'El descuento no puede dejar el total en $0';
  if (payments.length === 0) return 'Elegí un medio de pago';
  if (!payments.every((payment) => payment.amount > 0) || !paymentsCover(total, payments)) return 'Los pagos tienen que sumar el total';
  return null;
}

export function checkCheckout(subtotal: number, form: CheckoutForm): CheckoutCheck {
  const discount = { percentage: numberOf(form.percentage), amount: numberOf(form.amount) };
  const total = applyDiscount(subtotal, discount);
  const payments = paymentsOf(total, form);
  return { total, payments, discount, error: errorOf(total, discount, payments) };
}
