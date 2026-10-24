import { describe, expect, it } from 'vitest';
import type { DashboardSale, DashboardSnapshot } from '../domain/stats.schema';
import { computeDashboardStats, toDashboardRange } from './compute-dashboard-stats';

const EMPTY: DashboardSnapshot = { products: [], sales: [], losses: [] };

function aSale(overrides: Partial<DashboardSale> = {}): DashboardSale {
  return { total: '100.00', vendorId: 'vendedor-1', vendor: { username: 'ana' }, items: [], payments: [], ...overrides };
}

describe('computeDashboardStats', () => {
  it('devuelve todo en cero cuando no hay datos', () => {
    expect(computeDashboardStats(EMPTY)).toEqual({ totalEquipos: 0, totalModels: 0, totalRevenue: 0, currentInventoryCost: 0, netProfit: 0, totalLossCost: 0, topSellers: [], salesCount: 0, cashRevenue: 0, transferRevenue: 0 });
  });

  it('suma el stock y el costo del inventario', () => {
    const products = [{ stock: 3, purchasePrice: '10.50' }, { stock: 2, purchasePrice: '5.00' }];
    expect(computeDashboardStats({ ...EMPTY, products })).toMatchObject({ totalEquipos: 5, totalModels: 2, currentInventoryCost: 41.5 });
  });

  it('descuenta del ingreso el costo de lo vendido y de las mermas', () => {
    const sales = [aSale({ total: '300.00', items: [{ unitCost: '50.00', quantity: 2 }] })];
    const losses = [{ quantity: 2, product: { purchasePrice: '10.00' } }];
    expect(computeDashboardStats({ ...EMPTY, sales, losses })).toMatchObject({ totalRevenue: 300, totalLossCost: 20, netProfit: 180, salesCount: 1 });
  });

  it('una merma de un producto que ya no existe no suma costo', () => {
    expect(computeDashboardStats({ ...EMPTY, losses: [{ quantity: 3, product: null }] }).totalLossCost).toBe(0);
  });

  it('separa lo cobrado en efectivo y por transferencia', () => {
    const payments: DashboardSale['payments'] = [{ type: 'efectivo', amount: '70.00' }, { type: 'transferencia', amount: '30.00' }];
    expect(computeDashboardStats({ ...EMPTY, sales: [aSale({ payments })] })).toMatchObject({ cashRevenue: 70, transferRevenue: 30 });
  });

  it('agrupa por vendedor, ordena por total y deja los 5 primeros', () => {
    const sales = [1, 2, 3, 4, 5, 6].map((n) => aSale({ vendorId: `v${n}`, vendor: { username: `vendedor ${n}` }, total: `${n * 10}.00` }));
    const top = computeDashboardStats({ ...EMPTY, sales: [...sales, aSale({ vendorId: 'v6', vendor: { username: 'vendedor 6' }, total: '5.00' })] }).topSellers;
    expect(top.map((seller) => seller.username)).toEqual(['vendedor 6', 'vendedor 5', 'vendedor 4', 'vendedor 3', 'vendedor 2']);
    expect(top[0]).toEqual({ username: 'vendedor 6', total: 65, count: 2 });
  });

  it('muestra "Sistema" cuando la venta no tiene vendedor', () => {
    expect(computeDashboardStats({ ...EMPTY, sales: [aSale({ vendor: null })] }).topSellers[0].username).toBe('Sistema');
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
