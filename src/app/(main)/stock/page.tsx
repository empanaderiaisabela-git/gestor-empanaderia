'use client';

import type { JSX } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { StockPanel } from '@/features/stock/ui/stock-panel';

export default function StockPage(): JSX.Element {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader title='Stock' description='Stock de cada gusto y bebida, ingresos de mercadería y pérdidas.' />
      <StockPanel />
    </div>
  );
}
