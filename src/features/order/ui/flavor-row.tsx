import type { JSX } from 'react';
import { isPricedByGroup } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { type AddMode, isHalfAndHalf, type OrderLine, presentationOf, remaining } from '@/features/order/domain/order-line';
import { availableStock } from '@/features/order/domain/order-usage';
import { formatMoney } from '@/lib/format-money';
import type { OrderBoardModel } from './use-order-board';

type FlavorRowProps = { line: OrderLine; lines: OrderLine[]; item: MenuItemDef; board: OrderBoardModel; onAdd: (menuItemId: string, mode: AddMode) => void };

const button = 'px-3 py-1.5 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed';

function priceOf({ line, item, board }: Pick<FlavorRowProps, 'line' | 'item' | 'board'>): number | null {
  const field = presentationOf(line)?.priceField ?? 'price1';
  return isPricedByGroup(line.group) ? (board.book.group(line.group)?.[field] ?? null) : item[field];
}

export function FlavorRow({ line, lines, item, board, onAdd }: FlavorRowProps): JSX.Element {
  const presentation = presentationOf(line);
  const available = availableStock({ id: item.id, stock: item.stock }, lines);
  const free = remaining(line);
  const half = presentation ? isHalfAndHalf(presentation) : false;
  const isPack = (presentation?.units ?? 1) > 1;
  const chosen = line.flavors.some((flavor) => flavor.menuItemId === item.id);
  const price = priceOf({ line, item, board });
  return (
    <li className='flex items-center justify-between gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800'>
      <div>
        <p className='font-semibold text-zinc-900 dark:text-zinc-100'>{item.name}</p>
        <p className='text-xs text-zinc-500'>
          {price === null ? 'Sin precio' : formatMoney(price)} · stock {available.toLocaleString('es-AR')}
        </p>
      </div>
      <div className='flex gap-2'>
        {isPack ? (
          <>
            <button className={button} disabled={available < 1 || price === null} onClick={() => onAdd(item.id, 'one')}>
              Agregar uno
            </button>
            <button className={button} disabled={available < free || price === null} onClick={() => onAdd(item.id, 'rest')}>
              Completar
            </button>
          </>
        ) : (
          <button className={button} disabled={available < (half ? 0.5 : 1) || price === null || (half && chosen)} onClick={() => onAdd(item.id, 'one')}>
            Agregar
          </button>
        )}
      </div>
    </li>
  );
}
