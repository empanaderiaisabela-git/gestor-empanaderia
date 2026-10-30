import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { buyerLabel, saleRowSchema, voidSaleSchema } from './sale-history.schema';

const SALE = '20000000-0000-4000-8000-000000000001';
const ROW = {
  id: SALE,
  createdAt: new Date(0),
  buyerName: null,
  buyerPhone: null,
  buyerAddress: null,
  vendorName: 'vendedora',
  total: '18500.00',
  discountAmount: '0.00',
  discountPercentage: '10.00',
  lines: [
    { group: 'pizzas', presentationKey: 'pizza_2', promotionId: null, quantity: 1, unitPrice: '12000.00', subtotal: '12000.00', description: 'Muzza / Napolitana' },
    { group: null, presentationKey: null, promotionId: '30000000-0000-4000-8000-000000000001', quantity: 1, unitPrice: '9000.00', subtotal: '9000.00', description: 'Media + Coca: Carne · Coca 500' },
  ],
  payments: [{ type: 'debito', amount: '18500.00', cardName: null, installments: null, surchargeAmount: null }],
};

describe('lectura de una venta registrada (US-7 CA-1)', () => {
  it('convierte los importes de la base a números', () => {
    expect(saleRowSchema.parse(ROW)).toMatchObject({ total: 18500, discountPercentage: 10, lines: [{ unitPrice: 12000, subtotal: 12000 }, { group: null, unitPrice: 9000 }], payments: [{ type: 'debito', amount: 18500 }] });
  });

  it('una línea de promo no tiene grupo ni presentación, pero sí su promo (US-9)', () => {
    expect(saleRowSchema.safeParse({ ...ROW, lines: [{ ...ROW.lines[1], promotionId: 'x' }] }).success).toBe(false);
  });

  it('rechaza un medio de pago o un grupo desconocido', () => {
    expect(saleRowSchema.safeParse({ ...ROW, payments: [{ type: 'cheque', amount: '1' }] }).success).toBe(false);
    expect(saleRowSchema.safeParse({ ...ROW, lines: [{ ...ROW.lines[0], group: 'helados' }] }).success).toBe(false);
  });

  it('el comprador vacío se muestra "Sin nombre"', () => {
    expect([buyerLabel(null), buyerLabel('  '), buyerLabel('Marta')]).toEqual(['Sin nombre', 'Sin nombre', 'Marta']);
  });
});

describe('anular una venta (US-7 CA-3)', () => {
  it('pide un id válido y nada más', () => {
    expect(voidSaleSchema.parse({ saleId: SALE })).toEqual({ saleId: SALE });
    expect(voidSaleSchema.safeParse({ saleId: 'x' }).error?.issues[0]?.message).toBe('Elegí una venta válida');
    expect(voidSaleSchema.safeParse({ saleId: SALE, restock: false }).success).toBe(false);
  });

  it('fuzz: nunca lanza', () => {
    fc.assert(fc.property(fc.anything(), (input) => typeof voidSaleSchema.safeParse(input).success === 'boolean'));
  });
});
