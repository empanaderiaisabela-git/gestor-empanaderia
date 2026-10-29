'use client';

import { RefreshCcw } from 'lucide-react';
import type { JSX } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { type StatsModel, useWorkdayStats } from './use-workday-stats';
import { GroupKpis, PaymentKpis, SummaryKpis } from './workday-kpis';
import { SalesTable, VendorsTable } from './workday-tables';

function StatsToolbar({ model }: { model: StatsModel }): JSX.Element {
  const { period, setPeriod } = model;
  const setFrom = (from: string): void => void (from && setPeriod({ from, to: from > period.to ? from : period.to }));
  const setTo = (to: string): void => void (to && setPeriod({ from: to < period.from ? to : period.from, to }));
  return (
    <div className='flex flex-wrap items-end gap-3'>
      <DateRangePicker startDate={period.from} endDate={period.to} onStartChange={setFrom} onEndChange={setTo} />
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
      {stats.salesCount === 0 && <p className='text-sm font-semibold text-zinc-800 dark:text-zinc-200'>No hubo ventas en estas fechas.</p>}
      <GroupKpis stats={stats} />
      <SummaryKpis stats={stats} />
      <PaymentKpis stats={stats} />
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <VendorsTable rows={stats.vendorTable} />
        <SalesTable rows={stats.saleTable} withDate={stats.from !== stats.to} />
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
