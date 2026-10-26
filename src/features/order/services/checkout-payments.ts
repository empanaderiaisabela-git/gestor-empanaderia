import { AppError } from '@/lib/errors';
import type { CheckoutData } from '@/features/order/domain/checkout.schema';
import { round2 } from '@/features/order/domain/order-pricing';
import type { CheckoutScope } from '@/features/order/repository/checkout-unit-of-work';
import type { NewPayment } from '@/features/order/repository/sale-writer.repository';

type RequestedPayment = CheckoutData['payments'][number];

async function creditPayment(scope: CheckoutScope, { type, amount, cardId, installments }: RequestedPayment): Promise<NewPayment> {
  const card = cardId === undefined ? null : await scope.cards.findById(cardId);
  if (!card?.isActive) throw new AppError('NOT_FOUND', { entity: 'tarjeta' });
  const plan = card.plans.find((candidate) => candidate.installments === installments);
  if (!plan) throw new AppError('NOT_FOUND', { entity: 'plan de cuotas' });
  const surchargePct = Number(plan.surchargePct);
  return { type, amount, cardId: card.id, installments: plan.installments, surchargePct, surchargeAmount: round2((amount * surchargePct) / 100) };
}

export async function chargePayments(scope: CheckoutScope, payments: readonly RequestedPayment[]): Promise<NewPayment[]> {
  const charged: NewPayment[] = [];
  for (const payment of payments) {
    const plain = { type: payment.type, amount: payment.amount, cardId: null, installments: null, surchargePct: null, surchargeAmount: null };
    charged.push(payment.type === 'credito' ? await creditPayment(scope, payment) : plain);
  }
  return charged;
}

export const surchargeOf = (payments: readonly NewPayment[]): number => round2(payments.reduce((sum, payment) => sum + (payment.surchargeAmount ?? 0), 0));
