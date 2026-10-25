'use client';

import { Croissant, CupSoda, type LucideIcon, Pizza, Sandwich, Wheat } from 'lucide-react';
import type { JSX } from 'react';
import { GROUPS, isPricedByGroup, type MenuGroup, type Presentation } from '@/features/menu/domain/menu-groups';
import { unitsIn } from '@/features/order/domain/order-line';
import { useOrderStore } from '@/features/order/store/order.store';
import { formatMoney } from '@/lib/format-money';
import type { OrderBoardModel } from './use-order-board';

const ICONS: Readonly<Record<MenuGroup, LucideIcon>> = { empanadas: Croissant, pizzas: Pizza, sanguches: Sandwich, ciabattas: Wheat, coca_cola: CupSoda, pepsi: CupSoda };

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
  const Icon = ICONS[group];
  return (
    <section aria-label={GROUPS[group].label} className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3'>
      <header className='flex items-center gap-3'>
        <span className='w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center'>
          <Icon className='w-5 h-5 text-brand-600 dark:text-brand-400' />
        </span>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-zinc-500'>{GROUPS[group].label}</p>
          <p className='text-lg font-black text-zinc-900 dark:text-zinc-100'>{count.toLocaleString('es-AR')} en pedido</p>
        </div>
      </header>
      {blocked && <p className='text-xs font-semibold text-amber-700 dark:text-amber-400'>{blocked}</p>}
      <div className='grid grid-cols-2 gap-2'>
        {GROUPS[group].presentations.map((presentation) => (
          <button key={presentation.key} disabled={Boolean(blocked)} onClick={() => start(group, presentation.key)} className='rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-left hover:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed'>
            <span className='block font-bold text-zinc-900 dark:text-zinc-100'>{presentation.label}</span>
            <span className='block text-xs text-zinc-500'>{priceHint(group, presentation, board)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
