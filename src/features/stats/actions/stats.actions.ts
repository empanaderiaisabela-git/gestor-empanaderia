'use server';

import type { DashboardStatsResult } from '@/features/stats/domain/stats.schema';
import { toDashboardRange } from '@/features/stats/services/compute-dashboard-stats';
import { getDashboardStats } from '@/features/stats/services/dashboard-stats.service';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStatsResult> {
  try {
    await verifyAuthOrAdmin(false);
    return { success: true, data: await getDashboardStats(toDashboardRange({ startDate, endDate })) };
  } catch (error) {
    console.error('fetchDashboardStats error:', error);
    return { success: false, message: 'Error al obtener estadísticas' };
  }
}
