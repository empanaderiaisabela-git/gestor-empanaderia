import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { fetchWorkdayStats } from './fetch-workday-stats';

const snapshot = vi.hoisted(() => vi.fn());
const OCT_25 = { from: '2026-10-25', to: '2026-10-25' };

vi.mock('@/features/stats/repository/stats.repository', () => ({ getWorkdaySnapshot: snapshot }));

describe('fetchWorkdayStats (US-12, US-32 y regresión BUG-12)', () => {
  beforeEach(() => {
    snapshot.mockReset();
    snapshot.mockResolvedValue({ sales: [], losses: [] });
  });

  it('regresión BUG-12: el vendedor recibe FORBIDDEN y no se lee la base', async () => {
    await asUser({ role: 'vendedor' });
    expect(await fetchWorkdayStats(OCT_25)).toEqual({ success: false, code: 'FORBIDDEN', error: 'Solo los administradores pueden realizar esta acción' });
    expect(snapshot).not.toHaveBeenCalled();
  });

  it('UNAUTHENTICATED: sin sesión no devuelve datos', async () => {
    expect(await fetchWorkdayStats()).toMatchObject({ success: false, code: 'UNAUTHENTICATED' });
  });

  it('el admin recibe la jornada pedida, leída de 7:00 a 6:59 en hora de Argentina (CA-1)', async () => {
    await asUser({ role: 'admin' });
    expect(await fetchWorkdayStats(OCT_25)).toMatchObject({ success: true, data: { from: '2026-10-25', to: '2026-10-25', salesCount: 0, revenue: 0 } });
    expect(snapshot).toHaveBeenCalledWith({ start: new Date('2026-10-25T10:00:00.000Z'), end: new Date('2026-10-26T09:59:59.999Z') });
  });

  it('un rango va del inicio de la jornada "Desde" al fin de la jornada "Hasta" (US-32)', async () => {
    await asUser({ role: 'admin' });
    expect(await fetchWorkdayStats({ from: '2026-10-01', to: '2026-10-31' })).toMatchObject({ success: true, data: { from: '2026-10-01', to: '2026-10-31' } });
    expect(snapshot).toHaveBeenCalledWith({ start: new Date('2026-10-01T10:00:00.000Z'), end: new Date('2026-11-01T09:59:59.999Z') });
  });

  it('sin fechas, abre la jornada de hoy en las dos', async () => {
    await asUser({ role: 'admin' });
    const result = await fetchWorkdayStats();
    expect(result.success && /^\d{4}-\d{2}-\d{2}$/.test(result.data.from) && result.data.from === result.data.to).toBe(true);
  });

  it.each([
    { caso: 'una jornada inválida', period: { from: '2026-02-30', to: '2026-03-01' } },
    { caso: '"Hasta" anterior a "Desde"', period: { from: '2026-10-25', to: '2026-10-24' } },
    { caso: 'más de 366 días', period: { from: '2025-01-01', to: '2026-01-02' } },
  ])('VALIDATION: $caso no llega a la base (US-32)', async ({ period }) => {
    await asUser({ role: 'admin' });
    expect(await fetchWorkdayStats(period)).toMatchObject({ success: false, code: 'VALIDATION' });
    expect(snapshot).not.toHaveBeenCalled();
  });

  it('un error inesperado tiene la forma de ActionResult (regresión BUG-12)', async () => {
    await asUser({ role: 'admin' });
    snapshot.mockRejectedValue(new Error('se cayó la base'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await fetchWorkdayStats(OCT_25)).toEqual({ success: false, code: 'UNEXPECTED', error: 'Ocurrió un error inesperado al procesar el panel de estadísticas.' });
  });

  it('fuzz: ninguna entrada hace lanzar ni devuelve un error fuera del catálogo', async () => {
    await asUser({ role: 'admin' });
    const input = fc.oneof(fc.anything(), fc.record({ from: fc.string(), to: fc.string() }));
    await fc.assert(
      fc.asyncProperty(input, async (period) => {
        const result = await Reflect.apply(fetchWorkdayStats, undefined, [period]);
        expect(result.success || result.code === 'VALIDATION').toBe(true);
      }),
      { numRuns: 50 }
    );
  });
});
