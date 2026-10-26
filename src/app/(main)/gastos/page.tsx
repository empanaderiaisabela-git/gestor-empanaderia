'use client';

import type { JSX } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ExpensesPanel } from '@/features/expense/ui/expenses-panel';

export default function ExpensesPage(): JSX.Element {
  return (
    <div className='flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden'>
      <PageHeader title='Gastos' description='Anotador de las facturas de gastos del local. No cambia las Estadísticas.' />
      <ExpensesPanel />
    </div>
  );
}
