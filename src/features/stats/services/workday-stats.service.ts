import type { WorkdayStats } from '@/features/stats/domain/stats.schema';
import { workdayRange } from '@/features/stats/domain/workday';
import { getWorkdaySnapshot } from '@/features/stats/repository/stats.repository';
import { computeWorkdayStats } from './compute-workday-stats';

export async function getWorkdayStats(day: string): Promise<WorkdayStats> {
  return computeWorkdayStats(day, await getWorkdaySnapshot(workdayRange(day)));
}
