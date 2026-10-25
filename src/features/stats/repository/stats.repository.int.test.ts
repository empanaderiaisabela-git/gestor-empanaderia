import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { truncateAll } from '@/test/truncate-all';
import { getDashboardStats } from '../services/dashboard-stats.service';
import { DASHBOARD_RANGE, seedDashboard } from '../testing/seed-dashboard';
import { getDashboardSnapshot } from './stats.repository';

const PG_PARALLEL_QUERY_WARNING = 'already executing a query';

describe('estadísticas del dashboard contra db-test', () => {
  beforeEach(async () => {
    await truncateAll();
    await seedDashboard();
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('regression BUG-5: no lanza consultas simultáneas sobre la misma conexión', async () => {
    const emitWarning = vi.spyOn(process, 'emitWarning');
    await getDashboardSnapshot(DASHBOARD_RANGE);
    const warnings = emitWarning.mock.calls.map(([warning]) => String(warning));
    expect(warnings.filter((warning) => warning.includes(PG_PARALLEL_QUERY_WARNING))).toEqual([]);
  });

  it('trae los gustos activos y sólo las ventas y mermas del rango (T-12 CA-3)', async () => {
    const snapshot = await getDashboardSnapshot(DASHBOARD_RANGE);
    expect(snapshot.items).toEqual([{ stock: '10.0', unitCost: '100.00' }]);
    expect(snapshot.sales).toHaveLength(1);
    const [sale] = snapshot.sales;
    expect(sale).toMatchObject({ total: '500.00', vendor: { username: 'vendedora' } });
    expect(sale.items.map((item) => [Number(item.unitCost), Number(item.units)])).toEqual([[100, 2]]);
    expect(sale.payments.map((payment) => [payment.type, Number(payment.amount)]).sort()).toEqual([['efectivo', 300], ['transferencia', 200]]);
    expect(snapshot.losses.map((loss) => [Number(loss.quantity), Number(loss.unitCost)])).toEqual([[1, 100]]);
  });

  it('BUG-5 CA-2 y T-12 CA-3: los mismos totales del dashboard sobre los datos del rango', async () => {
    expect(await getDashboardStats(DASHBOARD_RANGE)).toEqual({
      totalUnits: 10,
      totalItems: 1,
      totalRevenue: 500,
      currentInventoryCost: 1000,
      netProfit: 200,
      totalLossCost: 100,
      topSellers: [{ username: 'vendedora', total: 500, count: 1 }],
      salesCount: 1,
      cashRevenue: 300,
      transferRevenue: 200,
      debitRevenue: 0,
      creditRevenue: 0,
    });
  });
});
