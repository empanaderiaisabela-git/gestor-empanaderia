import { describe, expect, it } from 'vitest';
import { describePayment } from './payment-describe';

const VISA = { type: 'credito' as const, amount: 6000, cardName: 'Visa', installments: 3, surchargeAmount: 600 };
const CASH = { type: 'efectivo' as const, amount: 4000, cardName: null, installments: null, surchargeAmount: null };

describe('cómo se lee un pago de la venta (US-11 CA-3)', () => {
  it('el crédito nombra la tarjeta y las cuotas; los demás medios, sólo el medio', () => {
    expect(describePayment(VISA)).toBe('Crédito · Visa · 3 cuotas');
    expect(describePayment({ ...VISA, installments: 1 })).toBe('Crédito · Visa · 1 cuota');
    expect(describePayment(CASH)).toBe('Efectivo');
    expect(describePayment({ ...VISA, cardName: null, installments: null })).toBe('Crédito');
  });
});
