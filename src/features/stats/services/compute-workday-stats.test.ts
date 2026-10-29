import { describe, expect, it } from 'vitest';
import type { StatsSale } from '@/features/stats/domain/stats.schema';
import { computeWorkdayStats } from './compute-workday-stats';

function sale(overrides: Partial<StatsSale>): StatsSale {
  return { createdAt: new Date('2026-10-25T15:00:00Z'), total: '0', buyerName: null, vendor: 'vendedora', lines: [], items: [], payments: [], ...overrides };
}

const DAY = { from: '2026-10-25', to: '2026-10-25' };
const cash = (amount: string) => ({ type: 'efectivo' as const, amount, surchargeAmount: null });

describe('KPI de la jornada (US-12 CA-2, CA-3 y CA-5)', () => {
  it('sin ventas, todo en cero', () => {
    const stats = computeWorkdayStats(DAY, { sales: [], losses: [] });
    expect(stats).toMatchObject({ from: '2026-10-25', to: '2026-10-25', promos: 0, revenue: 0, profit: 0, salesCount: 0, byPayment: { efectivo: 0, transferencia: 0, debito: 0, credito: 0 } });
    expect(Object.values(stats.byGroup)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('el dinero por comida suma cada línea en su grupo y las promos van aparte', () => {
    const lines = [{ group: 'empanadas' as const, subtotal: '12000.00' }, { group: 'pizzas' as const, subtotal: '11000.00' }, { group: null, subtotal: '9000.00' }];
    const stats = computeWorkdayStats(DAY, { sales: [sale({ total: '32000.00', lines, payments: [cash('32000.00')] })], losses: [] });
    expect(stats.byGroup).toMatchObject({ empanadas: 12000, pizzas: 11000, sanguches: 0 });
    expect([stats.promos, stats.revenue, stats.salesCount]).toEqual([9000, 32000, 1]);
  });

  it('el descuento de la venta se reparte entre las comidas según lo que pesa cada una', () => {
    const lines = [{ group: 'empanadas' as const, subtotal: '15000.00' }, { group: 'coca_cola' as const, subtotal: '5000.00' }];
    const stats = computeWorkdayStats(DAY, { sales: [sale({ total: '18000.00', lines, payments: [cash('18000.00')] })], losses: [] });
    expect([stats.byGroup.empanadas, stats.byGroup.coca_cola]).toEqual([13500, 4500]);
  });

  it('el recargo de las cuotas es de la tarjeta: no suma a las comidas, al crédito, a lo facturado ni a la ganancia (BUG-20)', () => {
    const payments = [cash('4000.00'), { type: 'credito' as const, amount: '6000.00', surchargeAmount: '600.00' }];
    const items = [{ units: '12', unitCost: '400.00' }];
    const stats = computeWorkdayStats(DAY, { sales: [sale({ total: '10000.00', lines: [{ group: 'empanadas', subtotal: '10000.00' }], items, payments })], losses: [] });
    expect(stats).toMatchObject({ revenue: 10000, profit: 5200, byPayment: { efectivo: 4000, credito: 6000 } });
    expect(stats.byGroup.empanadas).toBe(10000);
  });

  it('ganancia en limpio = facturado − costo para el local de lo vendido (también lo de las promos) − mermas (ejemplo del cliente: $10 → $30 deja $20)', () => {
    const pizza = sale({ total: '30.00', lines: [{ group: 'pizzas', subtotal: '30.00' }], items: [{ units: '1', unitCost: '10.00' }], payments: [cash('30.00')] });
    expect(computeWorkdayStats(DAY, { sales: [pizza], losses: [] }).profit).toBe(20);
    expect(computeWorkdayStats(DAY, { sales: [pizza], losses: [{ quantity: '0.5', unitCost: '10.00' }] }).profit).toBe(15);
  });

  it('cuenta las ventas y lo facturado por cada medio de pago', () => {
    const sales = [
      sale({ total: '1000.00', payments: [cash('1000.00')] }),
      sale({ total: '2500.00', payments: [{ type: 'transferencia', amount: '2000.00', surchargeAmount: null }, { type: 'debito', amount: '500.00', surchargeAmount: null }] }),
    ];
    expect(computeWorkdayStats(DAY, { sales, losses: [] })).toMatchObject({ salesCount: 2, revenue: 3500, byPayment: { efectivo: 1000, transferencia: 2000, debito: 500, credito: 0 } });
  });
});
