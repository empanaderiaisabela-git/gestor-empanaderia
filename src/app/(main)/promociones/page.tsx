'use client';

import type { JSX } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PromotionsPanel } from '@/features/promotion/ui/promotions-panel';

export default function PromotionsPage(): JSX.Element {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader title='Promociones' description='Combinaciones de productos con un precio de venta rebajado. Los gustos se eligen al vender.' />
      <PromotionsPanel />
    </div>
  );
}
