import { isHalfAndHalf, type OrderLine, presentationOf, unitsIn } from './order-line';
import { round2 } from './order-pricing';

export const PAYMENT_TYPES = ['efectivo', 'transferencia', 'debito', 'credito'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];
export const PAYMENT_LABELS: Readonly<Record<PaymentType, string>> = { efectivo: 'Efectivo', transferencia: 'Transferencia', debito: 'Débito', credito: 'Crédito' };
export type Payment = { type: PaymentType; amount: number };
export type Discount = { percentage: number; amount: number };

export function isValidLine(line: OrderLine): boolean {
  const presentation = presentationOf(line);
  if (!presentation || line.flavors.length === 0) return false;
  const ids = new Set(line.flavors.map((flavor) => flavor.menuItemId));
  if (ids.size !== line.flavors.length) return false;
  const stepOk = isHalfAndHalf(presentation)
    ? line.flavors.length === 2 && line.flavors.every((flavor) => flavor.units === 0.5)
    : line.flavors.every((flavor) => Number.isInteger(flavor.units) && flavor.units > 0);
  return stepOk && unitsIn(line) === presentation.units;
}

export function applyDiscount(subtotal: number, { percentage, amount }: Discount): number {
  return round2(subtotal * (1 - percentage / 100) - amount);
}

export function paymentsCover(total: number, payments: Payment[]): boolean {
  const types = new Set(payments.map((payment) => payment.type));
  const paid = round2(payments.reduce((sum, payment) => sum + payment.amount, 0));
  return types.size === payments.length && paid === round2(total);
}
