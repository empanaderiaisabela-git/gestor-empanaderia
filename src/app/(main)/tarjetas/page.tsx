'use client';

import type { JSX } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { CardsPanel } from '@/features/card/ui/cards-panel';

export default function CardsPage(): JSX.Element {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader title='Tarjetas' description='Tarjetas de crédito que acepta el local, con sus planes de cuotas y el recargo de cada uno.' />
      <CardsPanel />
    </div>
  );
}
