import { create } from 'zustand';
import type { WorkdayStats } from '@/features/stats/domain/stats.schema';

type StatsState = {
  stats: WorkdayStats | null;
  isLoaded: boolean;
  setStats: (stats: WorkdayStats | null) => void;
  setLoaded: (isLoaded: boolean) => void;
};

export const useStatsStore = create<StatsState>((set) => ({
  stats: null,
  isLoaded: false,
  setStats: (stats) => set({ stats, isLoaded: true }),
  setLoaded: (isLoaded) => set({ isLoaded }),
}));
