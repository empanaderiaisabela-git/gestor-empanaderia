import type { DashboardRange, DashboardStats } from '@/features/stats/domain/stats.schema';
import { getDashboardSnapshot } from '@/features/stats/repository/stats.repository';
import { computeDashboardStats } from './compute-dashboard-stats';

export async function getDashboardStats(range: DashboardRange): Promise<DashboardStats> {
  return computeDashboardStats(await getDashboardSnapshot(range));
}
