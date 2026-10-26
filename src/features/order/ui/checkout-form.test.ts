import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { BLANK_CHECKOUT, checkCheckout, paymentsOf, toggleMethod } from './checkout-form';

const form = (overrides: Partial<typeof BLANK_CHECKOUT>) => ({ ...BLANK_CHECKOUT, ...overrides });

describe('formulario de cobro (US-6 CA-1 y CA-5)', () => {
  it('arranca en efectivo por el total, sin descuento', () => {
    expect(checkCheckout(18500, BLANK_CHECKOUT)).toEqual({ total: 18500, payments: [{ type: 'efectivo', amount: 18500 }], discount: { percentage: 0, amount: 0 }, surcharge: 0, charged: 18500, error: null });
  });

  it('con dos medios, el segundo se lleva el resto', () => {
    expect(paymentsOf(18500, form({ methods: ['efectivo', 'debito'], split: '10000' }))).toEqual([
      { type: 'efectivo', amount: 10000 },
      { type: 'debito', amount: 8500 },
    ]);
  });

  it('hasta 2 medios: tocar un tercero reemplaza al más viejo, tocar uno elegido lo saca', () => {
    expect(toggleMethod(['efectivo'], 'credito')).toEqual(['efectivo', 'credito']);
    expect(toggleMethod(['efectivo', 'credito'], 'transferencia')).toEqual(['credito', 'transferencia']);
    expect(toggleMethod(['efectivo', 'credito'], 'efectivo')).toEqual(['credito']);
  });

  it('aplica el porcentaje y después el monto, aceptando coma decimal', () => {
    expect(checkCheckout(10000, form({ percentage: '10', amount: '500,5' })).total).toBe(8499.5);
  });

  it.each([
    { caso: 'porcentaje de 120', value: form({ percentage: '120' }), error: 'El descuento va de 0 a 100 %' },
    { caso: 'porcentaje que no es número', value: form({ percentage: 'diez' }), error: 'El descuento va de 0 a 100 %' },
    { caso: 'monto negativo', value: form({ amount: '-5' }), error: 'El descuento no puede ser negativo' },
    { caso: 'descuento total', value: form({ percentage: '100' }), error: 'El descuento no puede dejar el total en $0' },
    { caso: 'sin medio de pago', value: form({ methods: [] }), error: 'Elegí un medio de pago' },
    { caso: 'el primer pago cubre todo', value: form({ methods: ['efectivo', 'debito'], split: '18500' }), error: 'Los pagos tienen que sumar el total' },
    { caso: 'el primer pago no es número', value: form({ methods: ['efectivo', 'debito'], split: 'x' }), error: 'Los pagos tienen que sumar el total' },
  ])('avisa: $caso', ({ value, error }) => {
    expect(checkCheckout(18500, value).error).toBe(error);
  });

  it('crédito: pide la tarjeta y las cuotas, y suma el recargo sólo a la parte en crédito (US-11)', () => {
    const visa = { id: 'v', name: 'Visa', isActive: true, version: 1, plans: [{ installments: 3, surchargePct: 10 }], createdAt: '', updatedAt: '' };
    const mixed = form({ methods: ['efectivo', 'credito'], split: '4000' });
    expect(checkCheckout(10000, mixed, [visa]).error).toBe('Elegí la tarjeta y las cuotas');
    const check = checkCheckout(10000, { ...mixed, cardId: 'v', installments: '3' }, [visa]);
    expect(check).toMatchObject({ total: 10000, surcharge: 600, charged: 10600, error: null });
    expect(check.payments).toEqual([{ type: 'efectivo', amount: 4000 }, { type: 'credito', amount: 6000, cardId: 'v', installments: 3 }]);
  });

  it('fuzz: cualquier reparto válido entre dos medios cubre el total', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 1_000_000 }), fc.integer({ min: 1, max: 99 }), (total, share) => {
        const split = String(Math.floor((total * share) / 100) || 1);
        return checkCheckout(total, form({ methods: ['transferencia', 'debito'], split })).error === (Number(split) >= total ? 'Los pagos tienen que sumar el total' : null);
      })
    );
  });
});
