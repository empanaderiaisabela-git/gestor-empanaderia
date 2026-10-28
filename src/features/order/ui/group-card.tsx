'use client';

import type { JSX } from 'react';
import { GROUP_THEME } from '@/config/group-theme';
import { GROUPS, isPricedByGroup, type MenuGroup, type Presentation } from '@/features/menu/domain/menu-groups';
import { unitsIn } from '@/features/order/domain/order-line';
import { useOrderStore } from '@/features/order/store/order.store';
import { formatMoney } from '@/lib/format-money';
import type { OrderBoardModel } from './use-order-board';

function priceHint(group: MenuGroup, presentation: Presentation, board: OrderBoardModel): string {
  if (isPricedByGroup(group)) {
    const price = board.book.group(group)?.[presentation.priceField];
    return price === null || price === undefined ? 'Sin precio' : formatMoney(price);
  }
  const prices = board.itemsOf(group).flatMap((item) => (item[presentation.priceField] === null ? [] : [item[presentation.priceField] ?? 0]));
  return prices.length === 0 ? '' : `desde ${formatMoney(Math.min(...prices))}`;
}

function notice(group: MenuGroup, board: OrderBoardModel): string | null {
  if (board.itemsOf(group).length === 0) return 'Todavía no hay gustos cargados';
  if (isPricedByGroup(group) && !board.hasGroupPrice(group)) return 'Falta cargar el precio del grupo';
  return null;
}

export function GroupCard({ group, board }: { group: MenuGroup; board: OrderBoardModel }): JSX.Element {
  const lines = useOrderStore((state) => state.lines);
  const start = useOrderStore((state) => state.start);
  const count = lines.filter((line) => line.group === group).reduce((sum, line) => sum + unitsIn(line) * line.quantity, 0);
  const blocked = notice(group, board);
  const theme = GROUP_THEME[group];
  return (
    <section aria-label={GROUPS[group].label} className={`rounded-2xl border p-4 space-y-3 ${theme.card}`}>
      <header className='flex items-center gap-3'>
        <span className='w-10 h-10 rounded-xl bg-white/70 dark:bg-zinc-950/40 flex items-center justify-center'>
          <theme.icon className='w-6 h-6' aria-hidden='true' />
        </span>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200'>{GROUPS[group].label}</p>
          <p className='text-lg font-black text-zinc-900 dark:text-zinc-50'>{count.toLocaleString('es-AR')} en pedido</p>
        </div>
      </header>
      {blocked && <p className='text-xs font-semibold text-amber-800 dark:text-amber-300'>{blocked}</p>}
      <div className='grid grid-cols-2 gap-2'>
        {GROUPS[group].presentations.map((presentation) => (
          <button key={presentation.key} disabled={Boolean(blocked)} onClick={() => start(group, presentation.key)} className='rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-zinc-950/40 px-3 py-2.5 text-left hover:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed'>
            <span className='block font-bold text-zinc-900 dark:text-zinc-50'>{presentation.label}</span>
            <span className='block text-xs text-zinc-800 dark:text-zinc-200'>{priceHint(group, presentation, board)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
