import type { JSX } from 'react';
import { GROUP_THEME } from '@/config/group-theme';
import { GROUPS, MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import { PAYMENT_LABELS, PAYMENT_TYPES } from '@/features/order/domain/order-validation';
import type { WorkdayStats } from '@/features/stats/domain/stats.schema';
import { KpiCard } from './kpi-card';

const PROMOS_TONE = 'bg-brand-50 border-brand-200 dark:bg-brand-500/10 dark:border-brand-800';
const grid = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4';
const title = 'text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400';

export function GroupKpis({ stats }: { stats: WorkdayStats }): JSX.Element {
  return (
    <div className='space-y-3'>
      <h2 className={title}>Dinero generado por comida</h2>
      <div className={grid}>
        {MENU_GROUPS.map((group) => (
          <KpiCard key={group} label={GROUPS[group].label} value={stats.byGroup[group]} emoji={GROUP_THEME[group].emoji} tone={GROUP_THEME[group].card} />
        ))}
        <KpiCard label='Promos' value={stats.promos} emoji='🏷️' tone={PROMOS_TONE} />
      </div>
    </div>
  );
}

export function SummaryKpis({ stats }: { stats: WorkdayStats }): JSX.Element {
  return (
    <div className={grid}>
      <KpiCard label='Ganancia en limpio' value={stats.profit} hint='Lo facturado menos el costo para el local de lo vendido y las mermas.' />
      <KpiCard label='Ventas registradas' value={stats.salesCount} count />
      <KpiCard label='Total facturado' value={stats.revenue} hint='Con el recargo de las cuotas.' />
    </div>
  );
}

export function PaymentKpis({ stats }: { stats: WorkdayStats }): JSX.Element {
  return (
    <div className='space-y-3'>
      <h2 className={title}>Facturado por medio de pago</h2>
      <div className={grid}>
        {PAYMENT_TYPES.map((type) => (
          <KpiCard key={type} label={PAYMENT_LABELS[type]} value={stats.byPayment[type]} />
        ))}
      </div>
    </div>
  );
}
