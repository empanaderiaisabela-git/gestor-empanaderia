import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { checkoutSchema } from './checkout.schema';

const ITEM = '11111111-1111-4111-8111-111111111111';
const LINE = { group: 'empanadas', presentationKey: 'u1', flavors: [{ menuItemId: ITEM, units: 1 }], quantity: 2 };
const VALID = { lines: [LINE], discountPercentage: 0, discountAmount: 0, payments: [{ type: 'efectivo', amount: 3000 }] };
const first = (input: unknown): string | undefined => checkoutSchema.safeParse(input).error?.issues[0]?.message;

describe('lo que el navegador puede mandar al cobrar (US-6 CA-1 y CA-2)', () => {
  it('acepta un pedido y deja el comprador vacío como null', () => {
    expect(checkoutSchema.parse(VALID)).toEqual({ ...VALID, buyerName: null });
    expect(checkoutSchema.parse({ ...VALID, buyerName: '   ' }).buyerName).toBeNull();
    expect(checkoutSchema.parse({ ...VALID, buyerName: '  Marta ' }).buyerName).toBe('Marta');
  });

  it('acepta los 4 medios de pago, hasta 2 y distintos', () => {
    const payments = [{ type: 'debito', amount: 1000 }, { type: 'credito', amount: 2000, cardId: ITEM, installments: 3 }];
    expect(checkoutSchema.parse({ ...VALID, payments }).payments).toEqual(payments);
    expect(checkoutSchema.parse({ ...VALID, payments: [{ type: 'transferencia', amount: 3000 }] }).payments).toHaveLength(1);
  });

  it.each([
    { caso: 'pedido vacío', input: { ...VALID, lines: [] }, message: 'El pedido está vacío' },
    { caso: 'sin pagos', input: { ...VALID, payments: [] }, message: 'Elegí un medio de pago' },
    { caso: '3 pagos', input: { ...VALID, payments: [{ type: 'efectivo', amount: 1 }, { type: 'debito', amount: 1 }, { type: 'transferencia', amount: 1 }] }, message: 'Se aceptan hasta 2 medios de pago' },
    { caso: 'crédito sin tarjeta', input: { ...VALID, payments: [{ type: 'credito', amount: 3000 }] }, message: 'Elegí la tarjeta y las cuotas' },
    { caso: 'crédito sin cuotas', input: { ...VALID, payments: [{ type: 'credito', amount: 3000, cardId: ITEM }] }, message: 'Elegí la tarjeta y las cuotas' },
    { caso: 'tarjeta en efectivo', input: { ...VALID, payments: [{ type: 'efectivo', amount: 3000, cardId: ITEM, installments: 1 }] }, message: 'Elegí la tarjeta y las cuotas' },
    { caso: 'tarjeta inválida', input: { ...VALID, payments: [{ type: 'credito', amount: 3000, cardId: 'x', installments: 1 }] }, message: 'Elegí una tarjeta válida' },
    { caso: 'dos pagos en efectivo', input: { ...VALID, payments: [{ type: 'efectivo', amount: 1 }, { type: 'efectivo', amount: 1 }] }, message: 'Usá medios de pago distintos' },
    { caso: 'medio desconocido', input: { ...VALID, payments: [{ type: 'cheque', amount: 1 }] }, message: 'Elegí un medio de pago' },
    { caso: 'pago en 0', input: { ...VALID, payments: [{ type: 'efectivo', amount: 0 }] }, message: 'El monto debe ser mayor a 0' },
    { caso: 'descuento de 101 %', input: { ...VALID, discountPercentage: 101 }, message: 'El descuento no puede superar el 100 %' },
    { caso: 'descuento negativo', input: { ...VALID, discountAmount: -1 }, message: 'El descuento no puede ser negativo' },
    { caso: 'nombre de 61', input: { ...VALID, buyerName: 'a'.repeat(61) }, message: 'El nombre es demasiado largo' },
    { caso: 'cantidad 1,5', input: { ...VALID, lines: [{ ...LINE, quantity: 1.5 }] }, message: 'La cantidad tiene que ser un número entero' },
    { caso: 'gusto inválido', input: { ...VALID, lines: [{ ...LINE, flavors: [{ menuItemId: 'x', units: 1 }] }] }, message: 'Elegí un gusto válido' },
    { caso: 'grupo inexistente', input: { ...VALID, lines: [{ ...LINE, group: 'helados' }] }, message: 'Elegí un grupo válido' },
  ])('rechaza $caso con el mensaje exacto', ({ input, message }) => {
    expect(first(input)).toBe(message);
  });

  it('acepta un pedido sólo con promos, y una promo con sus partes (US-9)', () => {
    const promo = { promotionId: ITEM, quantity: 1, parts: [{ group: 'coca_cola', presentationKey: 'u1', flavors: [{ menuItemId: ITEM, units: 1 }] }] };
    expect(checkoutSchema.parse({ ...VALID, lines: [], promos: [promo] }).promos).toEqual([promo]);
    expect(first({ ...VALID, lines: [], promos: [] })).toBe('El pedido está vacío');
    expect(first({ ...VALID, promos: [{ ...promo, parts: [] }] })).toBe('La promo no tiene productos');
    expect(first({ ...VALID, promos: [{ ...promo, promotionId: 'x' }] })).toBe('Elegí una promo válida');
    expect(checkoutSchema.safeParse({ ...VALID, promos: [{ ...promo, price: 1 }] }).success).toBe(false);
  });

  it('no deja mandar precios, costos ni total (strictObject)', () => {
    expect(checkoutSchema.safeParse({ ...VALID, total: 1 }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...VALID, lines: [{ ...LINE, unitPrice: 1 }] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...VALID, lines: [{ ...LINE, flavors: [{ menuItemId: ITEM, units: 1, unitCost: 0 }] }] }).success).toBe(false);
  });

  it('fuzz: nunca lanza, pase lo que pase', () => {
    fc.assert(fc.property(fc.anything(), (input) => typeof checkoutSchema.safeParse(input).success === 'boolean'));
  });
});
