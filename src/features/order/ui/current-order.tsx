'use client';

import { Check, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { isComplete } from '@/features/order/domain/order-line';
import { canAddOne } from '@/features/order/domain/order-usage';
import { isPromoComplete, orderSubtotal, promoUsageLines } from '@/features/order/domain/promo-line';
import { useOrderStore } from '@/features/order/store/order.store';
import { formatMoney } from '@/lib/format-money';
import { CustomerFields } from './customer-fields';
import { OrderTable } from './order-table';
import type { OrderBoardModel } from './use-order-board';

type CurrentOrderProps = { board: OrderBoardModel; onCheckout?: () => void };

export function CurrentOrder({ board, onCheckout }: CurrentOrderProps): JSX.Element {
  const { lines, promos, buyer, remove, removeOne, addOne, toggleHam, clear, removePromo, reopenPromo, togglePromoHam } = useOrderStore();
  const visible = lines.filter((line) => line.flavors.length > 0);
  const usage = [...visible, ...promoUsageLines(promos)];
  const total = orderSubtotal(visible, promos, board.book);
  const ready = visible.length + promos.length > 0 && visible.every(isComplete) && promos.every(isPromoComplete) && total !== null && buyer.name.trim().length >= 2;
  return (
    <section aria-label='Pedido actual' className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 className='text-xl font-bold text-zinc-900 dark:text-zinc-50'>Pedido actual</h2>
        <p className='text-right'>
          <span className='block text-xs font-bold uppercase text-zinc-700 dark:text-zinc-200'>Total pedido</span>
          <span className='text-2xl font-black text-zinc-900 dark:text-zinc-50'>{formatMoney(total ?? 0)}</span>
        </p>
      </div>
      <CustomerFields />
      <OrderTable lines={visible} promos={promos} board={board} lineActions={{ onRemove: remove, onRemoveOne: removeOne, onAddOne: addOne, canAddOne: (line) => canAddOne(line, usage, board), onToggleHam: toggleHam }} promoActions={{ onRemove: removePromo, onReopen: reopenPromo, onToggleHam: togglePromoHam }} />
      <div className='flex justify-end gap-2'>
        <button onClick={clear} className='inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700'>
          <Trash2 className='w-4 h-4' /> Vaciar
        </button>
        <button onClick={onCheckout} disabled={!ready || !onCheckout} className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed'>
          <Check className='w-4 h-4' /> Cobrar {formatMoney(total ?? 0)}
        </button>
      </div>
    </section>
  );
}
