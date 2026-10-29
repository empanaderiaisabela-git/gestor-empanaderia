'use server';

import type { WorkdayStats } from '@/features/stats/domain/stats.schema';
import { type WorkdayPeriod, workdayOf, workdayPeriodSchema } from '@/features/stats/domain/workday';
import { getWorkdayStats } from '@/features/stats/services/workday-stats.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function fetchWorkdayStats(period?: WorkdayPeriod): Promise<ActionResult<WorkdayStats>> {
  try {
    await verifyAuthOrAdmin(true);
    const today = workdayOf(new Date());
    const parsed = workdayPeriodSchema.safeParse(period ?? { from: today, to: today });
    if (!parsed.success) return fail('VALIDATION');
    return { success: true, data: await getWorkdayStats(parsed.data) };
  } catch (error) {
    console.error('fetchWorkdayStats error:', error);
    return toActionFailure(error, 'el panel de estadísticas');
  }
}
