import { describe, expect, it } from 'vitest';
import { describePlan, describePlans } from './card-describe';

describe('cómo se leen los planes de una tarjeta (US-10)', () => {
  it('nombra las cuotas y el recargo, o "sin recargo"', () => {
    expect(describePlan({ installments: 1, surchargePct: 0 })).toBe('1 cuota sin recargo');
    expect(describePlan({ installments: 3, surchargePct: 10.5 })).toBe('3 cuotas +10,5 %');
  });

  it('lista los planes de menos a más cuotas', () => {
    expect(describePlans([{ installments: 6, surchargePct: 20 }, { installments: 1, surchargePct: 0 }])).toBe('1 cuota sin recargo · 6 cuotas +20 %');
  });
});
