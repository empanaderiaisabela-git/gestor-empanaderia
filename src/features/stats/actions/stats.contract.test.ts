import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { fetchDashboardStats } from './stats.actions';

const snapshot = vi.hoisted(() => vi.fn());

vi.mock('@/features/stats/repository/stats.repository', () => ({ getDashboardSnapshot: snapshot }));

const EMPTY = { products: [], sales: [], losses: [] };

describe('fetchDashboardStats (BUG-12)', () => {
  beforeEach(() => {
    snapshot.mockReset();
    snapshot.mockResolvedValue(EMPTY);
  });

  it('regression BUG-12: el vendedor recibe FORBIDDEN y no se lee la base', async () => {
    await asUser({ role: 'vendedor' });
    expect(await fetchDashboardStats()).toEqual({ success: false, code: 'FORBIDDEN', error: 'Solo los administradores pueden realizar esta acción' });
    expect(snapshot).not.toHaveBeenCalled();
  });

  it('UNAUTHENTICATED: sin sesión no devuelve datos', async () => {
    expect(await fetchDashboardStats()).toMatchObject({ success: false, code: 'UNAUTHENTICATED' });
  });

  it('el admin recibe las estadísticas', async () => {
    await asUser({ role: 'admin' });
    expect(await fetchDashboardStats('2026-10-01', '2026-10-25')).toMatchObject({ success: true, data: { salesCount: 0, totalRevenue: 0 } });
  });

  it('regression BUG-12: un error inesperado tiene la forma de ActionResult', async () => {
    await asUser({ role: 'admin' });
    snapshot.mockRejectedValue(new Error('se cayó la base'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await fetchDashboardStats()).toEqual({ success: false, code: 'UNEXPECTED', error: 'Ocurrió un error inesperado al procesar el/la panel de estadísticas.' });
  });
});
