import type { CardDef } from '@/features/card/domain/card.schema';
import { round2 } from '@/features/order/domain/order-pricing';
import { applyDiscount, type Discount, type Payment, type PaymentType, paymentsCover } from '@/features/order/domain/order-validation';

export type CheckoutForm = { percentage: string; amount: string; methods: PaymentType[]; split: string; cardId: string; installments: string };
export type FormPayment = Payment & { cardId?: string; installments?: number };
export type CheckoutCheck = { total: number; payments: FormPayment[]; discount: Discount; surcharge: number; charged: number; error: string | null };

export const BLANK_CHECKOUT: CheckoutForm = { percentage: '', amount: '', methods: ['efectivo'], split: '', cardId: '', installments: '' };

const numberOf = (text: string): number => (text.trim() === '' ? 0 : Number(text.replace(',', '.')));

export function toggleMethod(methods: PaymentType[], type: PaymentType): PaymentType[] {
  if (methods.includes(type)) return methods.filter((method) => method !== type);
  return [...methods, type].slice(-2);
}

function withCard(payment: Payment, { cardId, installments }: CheckoutForm): FormPayment {
  if (payment.type !== 'credito' || cardId === '' || installments === '') return payment;
  return { ...payment, cardId, installments: Number(installments) };
}

export function paymentsOf(total: number, form: CheckoutForm): FormPayment[] {
  const [first, second] = form.methods;
  if (!first) return [];
  if (!second) return [withCard({ type: first, amount: total }, form)];
  const amount = numberOf(form.split);
  return [withCard({ type: first, amount }, form), withCard({ type: second, amount: round2(total - amount) }, form)];
}

export function surchargeFor(payments: readonly FormPayment[], cards: readonly CardDef[]): number {
  const pctOf = ({ cardId, installments }: FormPayment): number => cards.find((card) => card.id === cardId)?.plans.find((plan) => plan.installments === installments)?.surchargePct ?? 0;
  return round2(payments.reduce((sum, payment) => sum + round2((payment.amount * pctOf(payment)) / 100), 0));
}

function errorOf(total: number, discount: Discount, payments: FormPayment[]): string | null {
  if (!(discount.percentage >= 0 && discount.percentage <= 100)) return 'El descuento va de 0 a 100 %';
  if (!(discount.amount >= 0)) return 'El descuento no puede ser negativo';
  if (total <= 0) return 'El descuento no puede dejar el total en $0';
  if (payments.length === 0) return 'Elegí un medio de pago';
  if (!payments.every((payment) => payment.amount > 0) || !paymentsCover(total, payments)) return 'Los pagos tienen que sumar el total';
  if (payments.some((payment) => payment.type === 'credito' && payment.cardId === undefined)) return 'Elegí la tarjeta y las cuotas';
  return null;
}

export function checkCheckout(subtotal: number, form: CheckoutForm, cards: readonly CardDef[] = []): CheckoutCheck {
  const discount = { percentage: numberOf(form.percentage), amount: numberOf(form.amount) };
  const total = applyDiscount(subtotal, discount);
  const payments = paymentsOf(total, form);
  const surcharge = surchargeFor(payments, cards);
  return { total, payments, discount, surcharge, charged: round2(total + surcharge), error: errorOf(total, discount, payments) };
}
