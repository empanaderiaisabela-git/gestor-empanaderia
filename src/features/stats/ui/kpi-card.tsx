import type { LucideIcon } from 'lucide-react';
import type { JSX } from 'react';
import { formatMoney } from '@/lib/format-money';

type KpiCardProps = { label: string; value: number; icon?: LucideIcon; hint?: string; tone?: string; count?: boolean };

export function KpiCard({ label, value, icon: Icon, hint, tone = 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800', count = false }: KpiCardProps): JSX.Element {
  return (
    <section aria-label={label} className={`rounded-2xl border p-4 flex flex-col gap-1 ${tone}`}>
      <p className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300'>
        {Icon && <Icon className='w-5 h-5' aria-hidden='true' />}
        {label}
      </p>
      <p className='text-2xl font-black text-zinc-900 dark:text-zinc-100'>{count ? value.toLocaleString('es-AR') : formatMoney(value)}</p>
      {hint && <p className='text-xs text-zinc-600 dark:text-zinc-400'>{hint}</p>}
    </section>
  );
}
