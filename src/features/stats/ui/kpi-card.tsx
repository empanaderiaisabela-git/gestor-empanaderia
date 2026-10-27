import type { LucideIcon } from 'lucide-react';
import type { JSX } from 'react';
import { NEUTRAL_CARD } from '@/config/stat-theme';
import { formatMoney } from '@/lib/format-money';

type KpiCardProps = { label: string; value: number; icon?: LucideIcon; chip?: string; tone?: string; count?: boolean };

export function KpiCard({ label, value, icon: Icon, chip = '', tone = `${NEUTRAL_CARD} border-zinc-200 dark:border-zinc-800`, count = false }: KpiCardProps): JSX.Element {
  return (
    <section aria-label={label} className={`rounded-2xl border-2 p-4 flex flex-col gap-3 ${tone}`}>
      {Icon && (
        <span className={`flex w-10 h-10 items-center justify-center rounded-xl ${chip}`}>
          <Icon className='w-5 h-5' aria-hidden='true' />
        </span>
      )}
      <p className='text-xs font-bold uppercase tracking-wider'>{label}</p>
      <p className='text-2xl font-black'>{count ? value.toLocaleString('es-AR') : formatMoney(value)}</p>
    </section>
  );
}
