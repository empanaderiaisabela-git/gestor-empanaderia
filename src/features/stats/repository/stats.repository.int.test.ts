import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { truncateAll } from '@/test/truncate-all';
import { periodRange, workdayRange } from '../domain/workday';
import { getWorkdayStats } from '../services/workday-stats.service';
import { SEEDED_WORKDAY, seedWorkday } from '../testing/seed-workday';
import { getWorkdaySnapshot } from './stats.repository';

const PG_PARALLEL_QUERY_WARNING = 'already executing a query';

describe('estadísticas de la jornada contra db-test (US-12)', () => {
  beforeEach(async () => {
    await truncateAll();
    await seedWorkday();
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('regresión BUG-5: no lanza consultas simultáneas sobre la misma conexión', async () => {
    const emitWarning = vi.spyOn(process, 'emitWarning');
    await getWorkdaySnapshot(workdayRange(SEEDED_WORKDAY));
    const warnings = emitWarning.mock.calls.map(([warning]) => String(warning));
    expect(warnings.filter((warning) => warning.includes(PG_PARALLEL_QUERY_WARNING))).toEqual([]);
  });

  it('trae sólo la jornada: la venta del almuerzo y la de la 0:30, no la de las 6:30 ni la de las 7:00 del día siguiente (CA-1)', async () => {
    const snapshot = await getWorkdaySnapshot(workdayRange(SEEDED_WORKDAY));
    expect(snapshot.sales.map((sale) => sale.createdAt.toISOString()).sort()).toEqual(['2026-10-25T16:00:00.000Z', '2026-10-26T03:30:00.000Z']);
    expect(snapshot.sales[0]).toMatchObject({ total: '500.00', buyerName: 'Marta', vendor: 'vendedora', lines: [{ group: 'empanadas', subtotal: '500.00' }] });
    expect(snapshot.losses).toHaveLength(1);
  });

  it('los KPI de la jornada sobre los datos sembrados (CA-2 a CA-5)', async () => {
    expect(await getWorkdayStats({ from: SEEDED_WORKDAY, to: SEEDED_WORKDAY })).toEqual({
      from: SEEDED_WORKDAY,
      to: SEEDED_WORKDAY,
      vendorTable: [
        { vendor: 'vendedora', shift: 'morning', count: 1, amount: 500 },
        { vendor: 'vendedora', shift: 'afternoon', count: 1, amount: 500 },
      ],
      saleTable: [
        { buyer: 'Marta', at: '2026-10-25T16:00:00.000Z', amount: 500 },
        { buyer: 'Marta', at: '2026-10-26T03:30:00.000Z', amount: 500 },
      ],
      byGroup: { empanadas: 1000, pizzas: 0, sanguches: 0, ciabattas: 0, coca_cola: 0, pepsi: 0 },
      promos: 0,
      revenue: 1000,
      profit: 500,
      salesCount: 2,
      byPayment: { efectivo: 600, transferencia: 400, debito: 0, credito: 0 },
    });
  });

  it('un rango de tres jornadas trae también la venta de las 6:30 y la de las 7:00 del día siguiente (US-32)', async () => {
    const snapshot = await getWorkdaySnapshot(periodRange({ from: '2026-10-24', to: '2026-10-26' }));
    expect(snapshot.sales).toHaveLength(4);
  });
});
