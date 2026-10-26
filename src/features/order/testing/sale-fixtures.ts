import type { SaleDef } from '@/features/order/domain/sale-history.schema';

export function saleDef(overrides: Partial<SaleDef> = {}): SaleDef {
  return {
    id: '20000000-0000-4000-8000-000000000001',
    createdAt: '2026-10-25T17:05:00.000Z',
    buyerName: 'Marta',
    vendorName: 'vendedora',
    total: 18500,
    discountAmount: 0,
    discountPercentage: 0,
    lines: [
      { group: 'empanadas', presentationKey: 'u6', promotionId: null, quantity: 1, unitPrice: 6500, subtotal: 6500, description: '2 Carne + 4 Pollo' },
      { group: 'pizzas', presentationKey: 'pizza_2', promotionId: null, quantity: 1, unitPrice: 12000, subtotal: 12000, description: 'Muzza / Napolitana' },
    ],
    payments: [
      { type: 'efectivo', amount: 10000 },
      { type: 'debito', amount: 8500 },
    ],
    ...overrides,
  };
}

export const MORNING_SALE = saleDef({ id: '20000000-0000-4000-8000-000000000002', createdAt: '2026-10-24T13:00:00.000Z', buyerName: null, vendorName: 'admin', total: 2500, discountPercentage: 10, discountAmount: 250, lines: [], payments: [{ type: 'credito', amount: 2500 }] });
