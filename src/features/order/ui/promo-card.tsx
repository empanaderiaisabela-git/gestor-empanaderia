'use client';

import { HandCoins } from 'lucide-react';
import { type JSX, useEffect } from 'react';
import { fetchPromotions } from '@/features/promotion/actions/fetch-promotions';
import { describeComponents } from '@/features/promotion/domain/promotion-describe';
import type { PromotionDef } from '@/features/promotion/domain/promotion.schema';
import { usePromotionStore } from '@/features/promotion/store/promotion.store';
import { useOrderStore } from '@/features/order/store/order.store';
import { formatMoney } from '@/lib/format-money';
import type { OrderBoardModel } from './use-order-board';

function useActivePromotions(): PromotionDef[] {
  const { promotions, isLoaded, setPromotions } = usePromotionStore();
  useEffect(() => {
    if (!isLoaded) fetchPromotions().then(setPromotions);
  }, [isLoaded, setPromotions]);
  return promotions.filter((promotion) => promotion.isActive);
}

function PromoButton({ promotion, board }: { promotion: PromotionDef; board: OrderBoardModel }): JSX.Element {
  const startPromo = useOrderStore((state) => state.startPromo);
  const missing = promotion.components.some((component) => board.itemsOf(component.group).length === 0);
  return (
    <button disabled={missing} onClick={() => startPromo(promotion)} title={missing ? 'Falta cargar gustos de algún producto' : undefined} className='rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-zinc-950/40 px-3 py-2.5 text-left hover:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed'>
      <span className='flex justify-between gap-2 font-bold text-zinc-900 dark:text-zinc-100'>
        <span>{promotion.name}</span>
        <span>{formatMoney(promotion.price)}</span>
      </span>
      <span className='block text-xs text-zinc-600 dark:text-zinc-400'>{describeComponents(promotion.components)}</span>
    </button>
  );
}

export function PromoCard({ board }: { board: OrderBoardModel }): JSX.Element {
  const promotions = useActivePromotions();
  const count = useOrderStore((state) => state.promos.length);
  return (
    <section aria-label='Promos' className='rounded-2xl border p-4 space-y-3 bg-brand-50 border-brand-200 dark:bg-brand-500/10 dark:border-brand-800'>
      <header className='flex items-center gap-3'>
        <span className='w-10 h-10 rounded-xl bg-white/70 dark:bg-zinc-950/40 flex items-center justify-center'>
          <HandCoins className='w-6 h-6' aria-hidden='true' />
        </span>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400'>Promos</p>
          <p className='text-lg font-black text-zinc-900 dark:text-zinc-100'>{count.toLocaleString('es-AR')} en pedido</p>
        </div>
      </header>
      {promotions.length === 0 && <p className='text-xs font-semibold text-amber-800 dark:text-amber-300'>Todavía no hay promos activas</p>}
      <div className='grid grid-cols-1 gap-2'>
        {promotions.map((promotion) => (
          <PromoButton key={promotion.id} promotion={promotion} board={board} />
        ))}
      </div>
    </section>
  );
}
