import { Minus, Plus, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { GROUPS } from '@/features/menu/domain/menu-groups';
import { describeFlavors, missingLabel } from '@/features/order/domain/order-describe';
import { type OrderLine, presentationOf, unitsIn } from '@/features/order/domain/order-line';
import { linePrice } from '@/features/order/domain/order-pricing';
import { formatMoney } from '@/lib/format-money';
import { HamSwitch } from './ham-switch';
import type { OrderBoardModel } from './use-order-board';

export type LineRowActions = { onRemove: (lineId: string) => void; onRemoveOne: (lineId: string) => void; onAddOne: (lineId: string) => void; canAddOne: (line: OrderLine) => boolean; onToggleHam: (lineId: string) => void };
type OrderLineRowProps = { line: OrderLine; board: OrderBoardModel; actions: LineRowActions };

const iconButton = 'p-1.5 rounded-lg text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed';

export function OrderLineRow({ line, board, actions }: OrderLineRowProps): JSX.Element {
  const missing = missingLabel(line);
  const price = linePrice(line, board.book);
  const quantity = `${presentationOf(line)?.label ?? ''}${line.quantity > 1 ? ` × ${line.quantity}` : ''}`;
  return (
    <tr className='border-b border-zinc-100 dark:border-zinc-800'>
      <td className='py-2 pr-3'>
        <span className='font-semibold text-zinc-900 dark:text-zinc-50'>{GROUPS[line.group].label}</span>
        <span className='block text-sm text-zinc-700 dark:text-zinc-200'>{describeFlavors(line, board.nameOf)}</span>
        {line.group === 'pizzas' && <HamSwitch checked={Boolean(line.ham)} price={board.book.ham ?? null} onToggle={() => actions.onToggleHam(line.id)} />}
        {missing && <span className='inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'>{missing}</span>}
      </td>
      <td className='py-2 px-3 text-sm whitespace-nowrap'>{quantity}</td>
      <td className='py-2 px-3 text-sm whitespace-nowrap'>{(unitsIn(line) * line.quantity).toLocaleString('es-AR')}</td>
      <td className='py-2 px-3 text-right font-semibold whitespace-nowrap'>{price === null ? '—' : formatMoney(price)}</td>
      <td className='py-2 text-right whitespace-nowrap'>
        <button onClick={() => actions.onRemoveOne(line.id)} title='Quitar uno' className={iconButton}>
          <Minus className='w-4 h-4' />
        </button>
        <button onClick={() => actions.onAddOne(line.id)} disabled={!actions.canAddOne(line)} title='Sumar uno' className={iconButton}>
          <Plus className='w-4 h-4' />
        </button>
        <button onClick={() => actions.onRemove(line.id)} title='Quitar del pedido' className='p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'>
          <Trash2 className='w-4 h-4' />
        </button>
      </td>
    </tr>
  );
}
