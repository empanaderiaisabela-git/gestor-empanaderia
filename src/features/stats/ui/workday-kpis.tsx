import type { JSX } from 'react';
import { GROUP_THEME } from '@/config/group-theme';
import { CARD_INK, PAYMENT_THEME, STAT_THEME } from '@/config/stat-theme';
import { GROUPS, MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import { PAYMENT_LABELS, PAYMENT_TYPES } from '@/features/order/domain/order-validation';
import type { WorkdayStats } from '@/features/stats/domain/stats.schema';
import { KpiCard } from './kpi-card';

const FOUR = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4';
const THREE = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4';
const TWO = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
const title = 'text-base font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200';

export function GroupKpis({ stats }: { stats: WorkdayStats }): JSX.Element {
  const card = (group: (typeof MENU_GROUPS)[number]): JSX.Element => {
    const theme = GROUP_THEME[group];
    return <KpiCard key={group} label={GROUPS[group].label} value={stats.byGroup[group]} icon={theme.icon} chip={theme.chip} tone={`${CARD_INK} ${theme.kpi}`} />;
  };
  return (
    <div className='space-y-3'>
      <h2 className={title}>Venta por categoría</h2>
      <div className='space-y-4'>
        <div className={FOUR}>{MENU_GROUPS.slice(0, 4).map(card)}</div>
        <div className={THREE}>
          {MENU_GROUPS.slice(4).map(card)}
          <KpiCard label='Promos' value={stats.promos} icon={STAT_THEME.promos.icon} chip={STAT_THEME.promos.chip} tone={STAT_THEME.promos.card} />
        </div>
      </div>
    </div>
  );
}

export function SummaryKpis({ stats }: { stats: WorkdayStats }): JSX.Element {
  const { sales, profit } = STAT_THEME;
  return (
    <div className='space-y-3'>
      <h2 className={title}>Cantidad de ventas y sus ganancias</h2>
      <div className={TWO}>
        <KpiCard label='Ventas registradas' value={stats.salesCount} count icon={sales.icon} chip={sales.chip} tone={sales.card} />
        <KpiCard label='Ganancia' value={stats.profit} icon={profit.icon} chip={profit.chip} tone={profit.card} />
      </div>
    </div>
  );
}

export function PaymentKpis({ stats }: { stats: WorkdayStats }): JSX.Element {
  return (
    <div className='space-y-3'>
      <h2 className={title}>Facturado por medio de pago</h2>
      <div className={FOUR}>
        {PAYMENT_TYPES.map((type) => (
          <KpiCard key={type} label={PAYMENT_LABELS[type]} value={stats.byPayment[type]} icon={PAYMENT_THEME[type].icon} chip={PAYMENT_THEME[type].chip} tone={PAYMENT_THEME[type].card} />
        ))}
      </div>
    </div>
  );
}
