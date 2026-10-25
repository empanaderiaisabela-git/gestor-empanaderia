import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { OrderLine } from './order-line';
import { applyDiscount, isValidLine, paymentsCover } from './order-validation';

const line = (group: OrderLine['group'], presentationKey: string, flavors: OrderLine['flavors']): OrderLine => ({ id: 'l', group, presentationKey, flavors, quantity: 1 });

describe('el servidor no confía en la línea que manda el navegador (US-6 CA-2)', () => {
  it.each([
    { caso: '½ docena surtida completa', value: line('empanadas', 'u6', [{ menuItemId: 'a', units: 2 }, { menuItemId: 'b', units: 4 }]), ok: true },
    { caso: 'pizza mitad y mitad', value: line('pizzas', 'pizza_2', [{ menuItemId: 'a', units: 0.5 }, { menuItemId: 'b', units: 0.5 }]), ok: true },
    { caso: 'bebida suelta', value: line('pepsi', 'u1', [{ menuItemId: 'a', units: 1 }]), ok: true },
    { caso: '½ docena incompleta', value: line('empanadas', 'u6', [{ menuItemId: 'a', units: 5 }]), ok: false },
    { caso: '½ docena con 7', value: line('empanadas', 'u6', [{ menuItemId: 'a', units: 7 }]), ok: false },
    { caso: 'empanada partida al medio', value: line('empanadas', 'u1', [{ menuItemId: 'a', units: 0.5 }, { menuItemId: 'b', units: 0.5 }]), ok: false },
    { caso: 'mitad y mitad del mismo sabor', value: line('pizzas', 'pizza_2', [{ menuItemId: 'a', units: 0.5 }, { menuItemId: 'a', units: 0.5 }]), ok: false },
    { caso: 'pizza de 2 sabores con uno entero', value: line('pizzas', 'pizza_2', [{ menuItemId: 'a', units: 1 }]), ok: false },
    { caso: 'presentación que el grupo no tiene', value: line('pizzas', 'u6', [{ menuItemId: 'a', units: 6 }]), ok: false },
    { caso: 'sin gustos', value: line('ciabattas', 'u1', []), ok: false },
    { caso: 'unidades negativas', value: line('empanadas', 'u3', [{ menuItemId: 'a', units: 4 }, { menuItemId: 'b', units: -1 }]), ok: false },
  ])('$caso → válida: $ok', ({ value, ok }) => {
    expect(isValidLine(value)).toBe(ok);
  });
});

describe('descuentos y pagos (US-6 CA-1, CA-2 y CA-5)', () => {
  it('aplica primero el porcentaje y después el monto, como el POS de siempre', () => {
    expect(applyDiscount(10000, { percentage: 10, amount: 500 })).toBe(8500);
    expect(applyDiscount(18500, { percentage: 0, amount: 0 })).toBe(18500);
  });

  it('los pagos tienen que sumar el total, con medios distintos', () => {
    expect(paymentsCover(18500, [{ type: 'efectivo', amount: 10000 }, { type: 'debito', amount: 8500 }])).toBe(true);
    expect(paymentsCover(18500, [{ type: 'credito', amount: 18000 }])).toBe(false);
    expect(paymentsCover(18500, [{ type: 'efectivo', amount: 9250 }, { type: 'efectivo', amount: 9250 }])).toBe(false);
  });

  it('fuzz: dividir el total en dos pagos de medios distintos siempre lo cubre', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), fc.integer({ min: 0, max: 100 }), (cents, share) => {
        const total = cents / 100;
        const first = Math.round(total * share) / 100;
        return paymentsCover(total, [{ type: 'efectivo', amount: first }, { type: 'transferencia', amount: Math.round((total - first) * 100) / 100 }]);
      })
    );
  });
});
