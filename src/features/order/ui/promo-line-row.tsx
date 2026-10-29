import { Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { unitsIn } from '@/features/order/domain/order-line';
import { describePromoFlavors, isPromoComplete, type PromoLine } from '@/features/order/domain/promo-line';
import { formatMoney } from '@/lib/format-money';
import type { OrderBoardModel } from './use-order-board';

export type PromoRowActions = { onRemove: (promoId: string) => void; onReopen: (promoId: string) => void };
type PromoLineRowProps = { promo: PromoLine; board: OrderBoardModel; actions: PromoRowActions };

export function PromoLineRow({ promo, board, actions }: PromoLineRowProps): JSX.Element {
  const units = promo.parts.reduce((sum, part) => sum + unitsIn(part), 0);
  const flavors = describePromoFlavors(promo, board.nameOf);
  return (
    <tr className='border-b border-zinc-100 dark:border-zinc-800'>
      <td className='py-2 pr-2'>
        <span className='font-semibold text-zinc-900 dark:text-zinc-50'>Promo · {promo.name}</span>
        {flavors && <span className='block text-sm text-zinc-700 dark:text-zinc-200'>{flavors}</span>}
        {!isPromoComplete(promo) && (
          <button onClick={() => actions.onReopen(promo.id)} className='inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'>
            faltan gustos · elegir
          </button>
        )}
      </td>
      <td className='py-2 pr-2 text-sm'>1 promo</td>
      <td className='py-2 pr-2 text-sm'>{units.toLocaleString('es-AR')}</td>
      <td className='py-2 pr-2 text-right font-semibold'>{formatMoney(promo.price)}</td>
      <td className='py-2 text-right'>
        <button onClick={() => actions.onRemove(promo.id)} title='Quitar del pedido' className='p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'>
          <Trash2 className='w-4 h-4' />
        </button>
      </td>
    </tr>
  );
}
