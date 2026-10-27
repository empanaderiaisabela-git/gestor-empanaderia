import { PAYMENT_LABELS, type PaymentType } from './order-validation';

type SoldPayment = { type: PaymentType; cardName: string | null; installments: number | null };

export function describePayment({ type, cardName, installments }: Pick<SoldPayment, 'type' | 'cardName' | 'installments'>): string {
  if (cardName === null || installments === null) return PAYMENT_LABELS[type];
  return `${PAYMENT_LABELS[type]} · ${cardName} · ${installments === 1 ? '1 cuota' : `${installments} cuotas`}`;
}
