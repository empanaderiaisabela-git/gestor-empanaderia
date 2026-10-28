import { Minus, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { GROUPS } from '@/features/menu/domain/menu-groups';
import { describeFlavors, missingLabel } from '@/features/order/domain/order-describe';
import { type OrderLine, presentationOf, unitsIn } from '@/features/order/domain/order-line';
import { linePrice } from '@/features/order/domain/order-pricing';
import { formatMoney } from '@/lib/format-money';
import type { OrderBoardModel } from './use-order-board';

type OrderLineRowProps = { line: OrderLine; board: OrderBoardModel; onRemove: (lineId: string) => void; onRemoveOne: (lineId: string) => void };

export function OrderLineRow({ line, board, onRemove, onRemoveOne }: OrderLineRowProps): JSX.Element {
  const missing = missingLabel(line);
  const price = linePrice(line, board.book);
  const quantity = `${presentationOf(line)?.label ?? ''}${line.quantity > 1 ? ` × ${line.quantity}` : ''}`;
  return (
    <tr className='border-b border-zinc-100 dark:border-zinc-800'>
      <td className='py-2 pr-2'>
        <span className='font-semibold text-zinc-900 dark:text-zinc-100'>{GROUPS[line.group].label}</span>
        <span className='block text-sm text-zinc-500'>{describeFlavors(line, board.nameOf)}</span>
        {missing && <span className='inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'>{missing}</span>}
      </td>
      <td className='py-2 pr-2 text-sm'>{quantity}</td>
      <td className='py-2 pr-2 text-sm'>{(unitsIn(line) * line.quantity).toLocaleString('es-AR')}</td>
      <td className='py-2 pr-2 text-right font-semibold'>{price === null ? '—' : formatMoney(price)}</td>
      <td className='py-2 text-right whitespace-nowrap'>
        <button onClick={() => onRemoveOne(line.id)} title='Quitar uno' className='p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'>
          <Minus className='w-4 h-4' />
        </button>
        <button onClick={() => onRemove(line.id)} title='Quitar del pedido' className='p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'>
          <Trash2 className='w-4 h-4' />
        </button>
      </td>
    </tr>
  );
}
