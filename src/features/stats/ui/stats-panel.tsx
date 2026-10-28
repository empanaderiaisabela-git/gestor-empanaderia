'use client';

import { RefreshCcw } from 'lucide-react';
import type { JSX } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { inputClass } from '@/components/ui/form-field';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { type StatsModel, useWorkdayStats } from './use-workday-stats';
import { GroupKpis, PaymentKpis, SummaryKpis } from './workday-kpis';
import { SalesTable, VendorsTable } from './workday-tables';

function StatsToolbar({ model }: { model: StatsModel }): JSX.Element {
  return (
    <div className='flex flex-wrap items-end gap-3'>
      <label className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
        Jornada
        <input type='date' value={model.day} onChange={(event) => event.target.value && model.setDay(event.target.value)} className={inputClass(false)} />
      </label>
      <Button variant='secondary' onClick={model.reload} disabled={model.loading} leftIcon={<RefreshCcw className={`w-4 h-4 ${model.loading ? 'animate-spin' : ''}`} />}>
        Sincronizar
      </Button>
    </div>
  );
}

function StatsBody({ model }: { model: StatsModel }): JSX.Element {
  if (model.error) return <ErrorAlert error={model.error} />;
  if (model.loading || !model.stats) return <TableSkeleton />;
  const { stats } = model;
  return (
    <div className='space-y-8'>
      {stats.salesCount === 0 && <p className='text-sm font-semibold text-zinc-800 dark:text-zinc-200'>No hubo ventas en esta jornada.</p>}
      <GroupKpis stats={stats} />
      <SummaryKpis stats={stats} />
      <PaymentKpis stats={stats} />
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <VendorsTable rows={stats.vendorTable} />
        <SalesTable rows={stats.saleTable} />
      </div>
    </div>
  );
}

export function StatsPanel(): JSX.Element {
  const model = useWorkdayStats();
  return (
    <div className='flex flex-col gap-6'>
      <StatsToolbar model={model} />
      <StatsBody model={model} />
    </div>
  );
}
