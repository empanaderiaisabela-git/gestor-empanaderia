import { useEffect, useState } from 'react';
import { fetchWorkdayStats } from '@/features/stats/actions/fetch-workday-stats';
import type { WorkdayStats } from '@/features/stats/domain/stats.schema';
import { type WorkdayPeriod, workdayOf } from '@/features/stats/domain/workday';
import { useStatsStore } from '@/features/stats/store/stats.store';

export type StatsModel = {
  period: WorkdayPeriod;
  setPeriod: (period: WorkdayPeriod) => void;
  stats: WorkdayStats | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useWorkdayStats(): StatsModel {
  const [period, setPeriod] = useState<WorkdayPeriod>(() => ({ from: workdayOf(new Date()), to: workdayOf(new Date()) }));
  const { stats, isLoaded, setStats, setLoaded } = useStatsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matches = stats?.from === period.from && stats.to === period.to;
  const current = isLoaded && matches;

  useEffect(() => {
    if (current) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetchWorkdayStats(period).then((result) => {
      if (!active) return;
      setLoading(false);
      if (result.success) setStats(result.data);
      else setError(result.error);
    });
    return () => {
      active = false;
    };
  }, [period, current, setStats]);

  return { period, setPeriod, stats: matches ? stats : null, loading, error, reload: () => setLoaded(false) };
}
