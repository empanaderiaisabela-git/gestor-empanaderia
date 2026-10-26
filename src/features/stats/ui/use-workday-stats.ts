import { useEffect, useState } from 'react';
import { fetchWorkdayStats } from '@/features/stats/actions/fetch-workday-stats';
import type { WorkdayStats } from '@/features/stats/domain/stats.schema';
import { workdayOf } from '@/features/stats/domain/workday';
import { useStatsStore } from '@/features/stats/store/stats.store';

export type StatsModel = {
  day: string;
  setDay: (day: string) => void;
  stats: WorkdayStats | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useWorkdayStats(): StatsModel {
  const [day, setDay] = useState(() => workdayOf(new Date()));
  const { stats, isLoaded, setStats, setLoaded } = useStatsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = isLoaded && stats?.day === day;

  useEffect(() => {
    if (current) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetchWorkdayStats(day).then((result) => {
      if (!active) return;
      setLoading(false);
      if (result.success) setStats(result.data);
      else setError(result.error);
    });
    return () => {
      active = false;
    };
  }, [day, current, setStats]);

  return { day, setDay, stats: stats?.day === day ? stats : null, loading, error, reload: () => setLoaded(false) };
}
