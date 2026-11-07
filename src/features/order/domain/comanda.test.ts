import { describe, expect, it } from 'vitest';
import { saleDef } from '../testing/sale-fixtures';
import { buildComanda } from './comanda';
import type { SaleLineDef } from './sale-history.schema';

const EQ = '='.repeat(32);
const DASH = '-'.repeat(32);
const cols = (left: string, right: string): string => left.padEnd(32 - right.length) + right;
const line = (overrides: Partial<SaleLineDef>): SaleLineDef => ({ group: 'empanadas', presentationKey: 'u1', promotionId: null, promotionName: null, quantity: 1, unitPrice: 0, subtotal: 0, description: '', items: [], ...overrides });

const ENVIO = saleDef({
  orderNumber: 143,
  createdAt: '2026-11-06T00:42:00.000Z',
  buyerName: 'Juan Perez',
  buyerAddress: 'Av. G. Hudson 1250',
  buyerPhone: '280-4567890',
  shippingTitle: 'Centro',
  shippingAmount: 1500,
  total: 13700,
  lines: [
    line({ presentationKey: 'u6', subtotal: 8000, items: [{ name: 'Jamón y queso', units: 6 }] }),
    line({ group: 'coca_cola', subtotal: 2500, items: [{ name: 'Cepita 1.0L Anana tropic', units: 1 }] }),
    line({ subtotal: 1700, items: [{ name: 'Jamón y queso', units: 1 }] }),
  ],
  payments: [{ type: 'efectivo', amount: 13700, cardName: null, installments: null, surchargeAmount: null }],
});

describe('comanda de 57 mm (US-65 CA-3 y CA-4)', () => {
  it('arma el ejemplo del cliente: envío, gustos iguales juntos y nombres largos en dos renglones', () => {
    expect(buildComanda(ENVIO, 'Empanadería Isabela')).toEqual([
      EQ, '      EMPANADERÍA ISABELA       ', EQ,
      'NRO PEDIDO: #000143', 'FECHA: 05/11/2026   HORA: 21:42', 'TIPO: ENVIO A DOMICILIO', DASH,
      '[ DATOS DEL CLIENTE / ENVIO ]', 'Cliente: Juan Perez', 'Direcc: Av. G. Hudson 1250', 'Tel: 280-4567890', DASH,
      'EMPANADAS', cols('7x JAMÓN Y QUESO', '$9.700'), 'BEBIDAS', cols('1x CEPITA 1.0L ANANA', '$2.500'), '   TROPIC', DASH,
      cols('SUBTOTAL:', '$12.200'), cols('ENVIO:', '$1.500'), EQ, cols('TOTAL GENERAL:', '$13.700'), EQ,
      'METODO PAGO: Efectivo', DASH, '    ¡GRACIAS POR SU COMPRA!     ', EQ,
    ]);
  });

  it('retira en local: surtidas, mitad y mitad con jamón, promos, descuento y dos medios de pago', () => {
    const sale = saleDef({
      buyerName: null,
      total: 32000,
      discountAmount: 1000,
      lines: [
        line({ group: 'pizzas', presentationKey: 'pizza_2', subtotal: 11500, description: 'Muzza / Napolitana + Jamón extra', items: [{ name: 'Muzza', units: 0.5 }, { name: 'Napolitana', units: 0.5 }] }),
        line({ presentationKey: 'u6', subtotal: 6500, items: [{ name: 'Carne', units: 3 }, { name: 'Pollo', units: 3 }] }),
        line({ group: null, presentationKey: null, promotionId: '30000000-0000-4000-8000-000000000001', promotionName: 'Docena + Coca', subtotal: 15000, items: [{ name: 'Carne', units: 12 }, { name: 'Coca 500', units: 1 }] }),
      ],
      payments: [{ type: 'efectivo', amount: 20000, cardName: null, installments: null, surchargeAmount: null }, { type: 'debito', amount: 12000, cardName: null, installments: null, surchargeAmount: null }],
    });
    const text = buildComanda(sale, 'Empanadería Isabela');
    expect(text.slice(5, 9)).toEqual(['TIPO: RETIRA EN LOCAL', DASH, '[ DATOS DEL CLIENTE ]', 'Cliente: Sin nombre']);
    expect(text.slice(10, 22)).toEqual([
      'PIZZAS', cols('1/2x MUZZA', '$11.500'), '1/2x NAPOLITANA', '   + JAMÓN EXTRA',
      'EMPANADAS', cols('3x CARNE', '$6.500'), '3x POLLO',
      'PROMO DOCENA + COCA', cols('12x CARNE', '$15.000'), '1x COCA 500', DASH, cols('SUBTOTAL:', '$33.000'),
    ]);
    expect(text.slice(22, 28)).toEqual([cols('DESCUENTO:', '-$1.000'), EQ, cols('TOTAL GENERAL:', '$32.000'), EQ, 'METODO PAGO:', cols('Efectivo', '$20.000')]);
    expect(text[28]).toBe(cols('Débito', '$12.000'));
  });

  it('Coca-Cola y Quilmes van juntas bajo BEBIDAS; la comida mantiene su grupo (US-67)', () => {
    const lines = [line({ group: 'coca_cola', subtotal: 2500, items: [{ name: 'Coca 500', units: 1 }] }), line({ group: 'pepsi', quantity: 2, subtotal: 6000, items: [{ name: 'Quilmes 1L', units: 2 }] })];
    const text = buildComanda(saleDef({ lines, total: 8500 }), 'Empanadería Isabela');
    expect(text.slice(10, 14)).toEqual(['BEBIDAS', cols('1x COCA 500', '$2.500'), cols('2x QUILMES 1L', '$6.000'), DASH]);
  });

  it('sin pagos, el medio de pago dice PENDIENTE (US-68)', () => {
    expect(buildComanda(saleDef({ payments: [] }), 'Empanadería Isabela')).toContain('METODO PAGO: PENDIENTE');
  });

  it('ningún renglón pasa de 32 caracteres, aunque el domicilio sea largo', () => {
    const text = buildComanda(saleDef({ buyerAddress: 'Avenida Gobernador Hudson 1250, entre Mitre y Belgrano, casa del fondo' }), 'Empanadería Isabela');
    expect(text.every((row) => row.length <= 32)).toBe(true);
    expect(text.find((row) => row.startsWith('Direcc:'))).toBe('Direcc: Avenida Gobernador');
    expect(text.join(' ')).toContain('casa del fondo');
  });
});
