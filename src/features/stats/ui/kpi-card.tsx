import type { JSX } from 'react';
import { formatMoney } from '@/lib/format-money';

type KpiCardProps = { label: string; value: number; emoji?: string; hint?: string; tone?: string; count?: boolean };

export function KpiCard({ label, value, emoji, hint, tone = 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800', count = false }: KpiCardProps): JSX.Element {
  return (
    <section aria-label={label} className={`rounded-2xl border p-4 flex flex-col gap-1 ${tone}`}>
      <p className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300'>
        {emoji && <span aria-hidden='true' className='text-lg leading-none'>{emoji}</span>}
        {label}
      </p>
      <p className='text-2xl font-black text-zinc-900 dark:text-zinc-100'>{count ? value.toLocaleString('es-AR') : formatMoney(value)}</p>
      {hint && <p className='text-xs text-zinc-600 dark:text-zinc-400'>{hint}</p>}
    </section>
  );
}
