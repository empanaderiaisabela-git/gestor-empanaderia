import { describe, expect, it } from 'vitest';
import type { DashboardSale, DashboardSnapshot } from '../domain/stats.schema';
import { computeDashboardStats, toDashboardRange } from './compute-dashboard-stats';

const EMPTY: DashboardSnapshot = { items: [], sales: [], losses: [] };
const ZERO = { totalUnits: 0, totalItems: 0, totalRevenue: 0, currentInventoryCost: 0, netProfit: 0, totalLossCost: 0, topSellers: [], salesCount: 0, cashRevenue: 0, transferRevenue: 0, debitRevenue: 0, creditRevenue: 0 };

function aSale(overrides: Partial<DashboardSale> = {}): DashboardSale {
  return { total: '100.00', vendorId: 'vendedor-1', vendor: { username: 'ana' }, items: [], payments: [], ...overrides };
}

describe('computeDashboardStats con el modelo de la empanadería (T-12 CA-3)', () => {
  it('devuelve todo en cero cuando no hay datos', () => {
    expect(computeDashboardStats(EMPTY)).toEqual(ZERO);
  });

  it('suma las unidades en stock (también medias pizzas) y el costo del inventario', () => {
    const items = [{ stock: '3.0', unitCost: '10.50' }, { stock: '2.5', unitCost: '4000.00' }];
    expect(computeDashboardStats({ ...EMPTY, items })).toMatchObject({ totalUnits: 5.5, totalItems: 2, currentInventoryCost: 10031.5 });
  });

  it('descuenta del ingreso el costo congelado de lo vendido y el de las mermas', () => {
    const sales = [aSale({ total: '6500.00', items: [{ units: '0.5', unitCost: '2000.00' }, { units: '0.5', unitCost: '1500.00' }] })];
    const losses = [{ quantity: '2', unitCost: '450.00' }];
    expect(computeDashboardStats({ ...EMPTY, sales, losses })).toMatchObject({ totalRevenue: 6500, totalLossCost: 900, netProfit: 3850, salesCount: 1 });
  });

  it('separa lo cobrado en efectivo, transferencia, débito y crédito', () => {
    const payments: DashboardSale['payments'] = [
      { type: 'efectivo', amount: '70.00' },
      { type: 'transferencia', amount: '30.00' },
      { type: 'debito', amount: '20.00' },
      { type: 'credito', amount: '10.00' },
    ];
    expect(computeDashboardStats({ ...EMPTY, sales: [aSale({ payments })] })).toMatchObject({ cashRevenue: 70, transferRevenue: 30, debitRevenue: 20, creditRevenue: 10 });
  });

  it('agrupa por vendedor, ordena por total y deja los 5 primeros', () => {
    const sales = [1, 2, 3, 4, 5, 6].map((n) => aSale({ vendorId: `v${n}`, vendor: { username: `vendedor ${n}` }, total: `${n * 10}.00` }));
    const top = computeDashboardStats({ ...EMPTY, sales: [...sales, aSale({ vendorId: 'v6', vendor: { username: 'vendedor 6' }, total: '5.00' })] }).topSellers;
    expect(top.map((seller) => seller.username)).toEqual(['vendedor 6', 'vendedor 5', 'vendedor 4', 'vendedor 3', 'vendedor 2']);
    expect(top[0]).toEqual({ username: 'vendedor 6', total: 65, count: 2 });
  });

  it('muestra "Sistema" cuando la venta no tiene vendedor y tolera valores vacíos', () => {
    const sales = [aSale({ vendorId: '', vendor: null, items: [{ units: '3', unitCost: '' }] })];
    const stats = computeDashboardStats({ items: [{ stock: '', unitCost: '' }], sales, losses: [{ quantity: '', unitCost: '' }] });
    expect(stats).toMatchObject({ totalUnits: 0, currentInventoryCost: 0, totalLossCost: 0, netProfit: 100, topSellers: [{ username: 'Sistema', total: 100, count: 1 }] });
  });
});

describe('toDashboardRange', () => {
  const now = new Date('2026-05-01T10:00:00Z');

  it('sin fechas va desde el comienzo hasta ahora', () => {
    expect(toDashboardRange({ now })).toEqual({ start: new Date(0), end: now });
  });

  it('con fechas toma el comienzo del primer día y el final del último', () => {
    expect(toDashboardRange({ startDate: '2026-03-01', endDate: '2026-03-31', now })).toEqual({ start: new Date('2026-03-01T00:00:00'), end: new Date('2026-03-31T23:59:59') });
  });
});
