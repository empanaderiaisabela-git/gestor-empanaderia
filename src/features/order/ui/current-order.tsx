'use client';

import { Check, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { isComplete } from '@/features/order/domain/order-line';
import { orderTotal } from '@/features/order/domain/order-pricing';
import { useOrderStore } from '@/features/order/store/order.store';
import { formatMoney } from '@/lib/format-money';
import { OrderTable } from './order-table';
import type { OrderBoardModel } from './use-order-board';

type CurrentOrderProps = { board: OrderBoardModel; onCheckout?: () => void };

export function CurrentOrder({ board, onCheckout }: CurrentOrderProps): JSX.Element {
  const { lines, buyerName, setBuyerName, remove, clear } = useOrderStore();
  const visible = lines.filter((line) => line.flavors.length > 0);
  const total = orderTotal(visible, board.book);
  const ready = visible.length > 0 && visible.every(isComplete) && total !== null;
  return (
    <section aria-label='Pedido actual' className='rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>Pedido actual</h2>
        <p className='text-right'>
          <span className='block text-xs font-bold uppercase text-zinc-500'>Total pedido</span>
          <span className='text-2xl font-black text-zinc-900 dark:text-zinc-100'>{formatMoney(total ?? 0)}</span>
        </p>
      </div>
      <label className='block text-sm text-zinc-700 dark:text-zinc-300'>
        Comprador (opcional)
        <input value={buyerName} maxLength={60} onChange={(event) => setBuyerName(event.target.value)} placeholder='Sin nombre' className='mt-1 w-full px-3 py-2 border rounded-lg border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950' />
      </label>
      <OrderTable lines={visible} board={board} onRemove={remove} />
      <div className='flex justify-end gap-2'>
        <button onClick={clear} className='inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700'>
          <Trash2 className='w-4 h-4' /> Vaciar
        </button>
        <button onClick={onCheckout} disabled={!ready || !onCheckout} className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed'>
          <Check className='w-4 h-4' /> Cobrar {formatMoney(total ?? 0)}
        </button>
      </div>
    </section>
  );
}
