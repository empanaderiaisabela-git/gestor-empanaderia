import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { fetchWorkdayStats } from './fetch-workday-stats';

const snapshot = vi.hoisted(() => vi.fn());

vi.mock('@/features/stats/repository/stats.repository', () => ({ getWorkdaySnapshot: snapshot }));

describe('fetchWorkdayStats (US-12 y regresión BUG-12)', () => {
  beforeEach(() => {
    snapshot.mockReset();
    snapshot.mockResolvedValue({ sales: [], losses: [] });
  });

  it('regresión BUG-12: el vendedor recibe FORBIDDEN y no se lee la base', async () => {
    await asUser({ role: 'vendedor' });
    expect(await fetchWorkdayStats('2026-10-25')).toEqual({ success: false, code: 'FORBIDDEN', error: 'Solo los administradores pueden realizar esta acción' });
    expect(snapshot).not.toHaveBeenCalled();
  });

  it('UNAUTHENTICATED: sin sesión no devuelve datos', async () => {
    expect(await fetchWorkdayStats()).toMatchObject({ success: false, code: 'UNAUTHENTICATED' });
  });

  it('el admin recibe la jornada pedida, leída de 7:00 a 6:59 en hora de Argentina (CA-1)', async () => {
    await asUser({ role: 'admin' });
    expect(await fetchWorkdayStats('2026-10-25')).toMatchObject({ success: true, data: { day: '2026-10-25', salesCount: 0, revenue: 0 } });
    expect(snapshot).toHaveBeenCalledWith({ start: new Date('2026-10-25T10:00:00.000Z'), end: new Date('2026-10-26T09:59:59.999Z') });
  });

  it('sin jornada, abre la de hoy', async () => {
    await asUser({ role: 'admin' });
    const result = await fetchWorkdayStats();
    expect(result.success && /^\d{4}-\d{2}-\d{2}$/.test(result.data.day)).toBe(true);
  });

  it('VALIDATION: una jornada inválida no llega a la base', async () => {
    await asUser({ role: 'admin' });
    expect(await fetchWorkdayStats('2026-02-30')).toMatchObject({ success: false, code: 'VALIDATION' });
    expect(snapshot).not.toHaveBeenCalled();
  });

  it('un error inesperado tiene la forma de ActionResult (regresión BUG-12)', async () => {
    await asUser({ role: 'admin' });
    snapshot.mockRejectedValue(new Error('se cayó la base'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await fetchWorkdayStats('2026-10-25')).toEqual({ success: false, code: 'UNEXPECTED', error: 'Ocurrió un error inesperado al procesar el/la panel de estadísticas.' });
  });

  it('fuzz: ninguna entrada hace lanzar ni devuelve un error fuera del catálogo', async () => {
    await asUser({ role: 'admin' });
    await fc.assert(
      fc.asyncProperty(fc.string(), async (day) => {
        const result = await fetchWorkdayStats(day);
        expect(result.success || result.code === 'VALIDATION').toBe(true);
      }),
      { numRuns: 50 }
    );
  });
});
