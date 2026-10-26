'use server';

import type { WorkdayStats } from '@/features/stats/domain/stats.schema';
import { workdayOf, workdaySchema } from '@/features/stats/domain/workday';
import { getWorkdayStats } from '@/features/stats/services/workday-stats.service';
import { type ActionResult, fail } from '@/lib/action-result';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { toActionFailure } from '@/lib/db-errors';

export async function fetchWorkdayStats(day?: string): Promise<ActionResult<WorkdayStats>> {
  try {
    await verifyAuthOrAdmin(true);
    const parsed = workdaySchema.safeParse(day ?? workdayOf(new Date()));
    if (!parsed.success) return fail('VALIDATION');
    return { success: true, data: await getWorkdayStats(parsed.data) };
  } catch (error) {
    console.error('fetchWorkdayStats error:', error);
    return toActionFailure(error, 'panel de estadísticas');
  }
}
