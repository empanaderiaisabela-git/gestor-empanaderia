import { Minus, Plus, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { GROUPS } from '@/features/menu/domain/menu-groups';
import { lastToRemove, unitPresentationOf } from '@/features/order/domain/order-groups';
import { type OrderLine, presentationOf, unitsIn } from '@/features/order/domain/order-line';
import { linePrice } from '@/features/order/domain/order-pricing';
import { formatMoney } from '@/lib/format-money';
import type { LineRowActions } from './order-line-row';
import type { OrderBoardModel } from './use-order-board';

type GroupedLineRowProps = { lines: OrderLine[]; board: OrderBoardModel; actions: LineRowActions };

const iconButton = 'p-1.5 rounded-lg text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed';

const quantityOf = (line: OrderLine): string => `${presentationOf(line)?.label ?? ''}${line.quantity > 1 ? ` × ${line.quantity}` : ''}`;

function totalOf(lines: OrderLine[], board: OrderBoardModel): number | null {
  const prices = lines.map((line) => linePrice(line, board.book));
  return prices.some((price) => price === null) ? null : prices.reduce<number>((sum, price) => sum + (price ?? 0), 0);
}

function unitCandidate(first: OrderLine): OrderLine {
  return { ...first, id: '', presentationKey: unitPresentationOf(first.group)?.key ?? first.presentationKey, flavors: [{ menuItemId: first.flavors[0].menuItemId, units: 1 }], quantity: 1 };
}

export function GroupedLineRow({ lines, board, actions }: GroupedLineRowProps): JSX.Element {
  const [first] = lines;
  const total = totalOf(lines, board);
  const units = lines.reduce((sum, line) => sum + unitsIn(line) * line.quantity, 0);
  const removeAll = (): void => lines.forEach((line) => actions.onRemove(line.id));
  return (
    <tr className='border-b border-zinc-100 dark:border-zinc-800'>
      <td className='py-2 pr-3'>
        <span className='font-semibold text-zinc-900 dark:text-zinc-50'>{GROUPS[first.group].label}</span>
        <span className='block text-sm text-zinc-700 dark:text-zinc-200'>{board.nameOf(first.flavors[0].menuItemId)}</span>
      </td>
      <td className='py-2 px-3 text-sm'>{lines.map(quantityOf).join(' + ')}</td>
      <td className='py-2 px-3 text-sm whitespace-nowrap'>{units.toLocaleString('es-AR')}</td>
      <td className='py-2 px-3 text-right font-semibold whitespace-nowrap'>{total === null ? '—' : formatMoney(total)}</td>
      <td className='py-2 text-right whitespace-nowrap'>
        <button onClick={() => actions.onRemoveOne(lastToRemove(lines).id)} title='Quitar uno' className={iconButton}>
          <Minus className='w-4 h-4' />
        </button>
        <button onClick={() => actions.onAddUnit(first.id)} disabled={!actions.canAddOne(unitCandidate(first))} title='Sumar uno' className={iconButton}>
          <Plus className='w-4 h-4' />
        </button>
        <button onClick={removeAll} title='Quitar del pedido' className='p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'>
          <Trash2 className='w-4 h-4' />
        </button>
      </td>
    </tr>
  );
}
