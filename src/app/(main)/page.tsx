'use client';

import type { JSX } from 'react';
import { StatsPanel } from '@/features/stats/ui/stats-panel';

export default function StatsPage(): JSX.Element {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-y-auto'>
      <StatsPanel />
    </div>
  );
}
