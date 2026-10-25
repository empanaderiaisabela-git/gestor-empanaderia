'use server';

import type { DashboardStats } from '@/features/stats/domain/stats.schema';
import { toDashboardRange } from '@/features/stats/services/compute-dashboard-stats';
import { getDashboardStats } from '@/features/stats/services/dashboard-stats.service';
import type { ActionResult } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function fetchDashboardStats(startDate?: string, endDate?: string): Promise<ActionResult<DashboardStats>> {
  try {
    await verifyAuthOrAdmin(true);
    return { success: true, data: await getDashboardStats(toDashboardRange({ startDate, endDate })) };
  } catch (error) {
    console.error('fetchDashboardStats error:', error);
    return toActionFailure(error, 'panel de estadísticas');
  }
}
