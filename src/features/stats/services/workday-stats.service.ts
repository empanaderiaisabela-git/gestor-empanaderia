import type { WorkdayStats } from '@/features/stats/domain/stats.schema';
import { periodRange, type WorkdayPeriod } from '@/features/stats/domain/workday';
import { getWorkdaySnapshot } from '@/features/stats/repository/stats.repository';
import { computeWorkdayStats } from './compute-workday-stats';

export async function getWorkdayStats(period: WorkdayPeriod): Promise<WorkdayStats> {
  return computeWorkdayStats(period, await getWorkdaySnapshot(periodRange(period)));
}
