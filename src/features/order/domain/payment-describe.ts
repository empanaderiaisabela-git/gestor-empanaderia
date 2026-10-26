import { round2 } from './order-pricing';
import { PAYMENT_LABELS, type PaymentType } from './order-validation';

type SoldPayment = { type: PaymentType; amount: number; cardName: string | null; installments: number | null; surchargeAmount: number | null };

export function describePayment({ type, cardName, installments }: Pick<SoldPayment, 'type' | 'cardName' | 'installments'>): string {
  if (cardName === null || installments === null) return PAYMENT_LABELS[type];
  return `${PAYMENT_LABELS[type]} · ${cardName} · ${installments === 1 ? '1 cuota' : `${installments} cuotas`}`;
}

export const chargedAmount = ({ amount, surchargeAmount }: Pick<SoldPayment, 'amount' | 'surchargeAmount'>): number => round2(amount + (surchargeAmount ?? 0));

export const surchargeTotal = (payments: readonly Pick<SoldPayment, 'surchargeAmount'>[]): number => round2(payments.reduce((sum, payment) => sum + (payment.surchargeAmount ?? 0), 0));
