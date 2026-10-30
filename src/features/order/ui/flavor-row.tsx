import type { JSX } from 'react';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import type { Presentation } from '@/features/menu/domain/menu-groups';
import { type AddMode, isHalfAndHalf, type OrderLine, presentationOf, remaining } from '@/features/order/domain/order-line';
import { flavorPrice } from '@/features/order/domain/flavor-list';
import { availableStock } from '@/features/order/domain/order-usage';
import { formatMoney } from '@/lib/format-money';
import type { OrderBoardModel } from './use-order-board';

type FlavorRowProps = { line: OrderLine; lines: OrderLine[]; item: MenuItemDef; board: OrderBoardModel; inPromo?: boolean; onAdd: (menuItemId: string, mode: AddMode) => void; onRemove: (menuItemId: string) => void };

const base = 'px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap text-white disabled:opacity-40 disabled:cursor-not-allowed';
const button = `${base} bg-brand-600 hover:bg-brand-700`;
const removeButton = `${base} bg-red-600 hover:bg-red-700`;

function priceLabel(price: number | null, inPromo: boolean): string {
  if (inPromo) return 'En la promo';
  return price === null ? 'Sin precio' : formatMoney(price);
}

type Kind = 'pack' | 'half' | 'single';
type AddButtonsProps = { id: string; kind: Kind; free: number; available: number; blocked: boolean; chosen: boolean; onAdd: FlavorRowProps['onAdd'] };

function kindOf(presentation: Presentation | null): Kind {
  if ((presentation?.units ?? 1) > 1) return 'pack';
  return presentation && isHalfAndHalf(presentation) ? 'half' : 'single';
}

function AddButtons({ id, kind, free, available, blocked, chosen, onAdd }: AddButtonsProps): JSX.Element {
  if (kind !== 'pack')
    return (
      <button className={button} disabled={available < (kind === 'half' ? 0.5 : 1) || blocked || (kind === 'half' && chosen)} onClick={() => onAdd(id, 'one')}>
        Agregar
      </button>
    );
  return (
    <>
      <button className={button} disabled={available < 1 || blocked} onClick={() => onAdd(id, 'one')}>
        Agregar uno
      </button>
      <button className={button} disabled={available < free || blocked} onClick={() => onAdd(id, 'rest')}>
        Completar
      </button>
    </>
  );
}

export function FlavorRow({ line, lines, item, board, inPromo = false, onAdd, onRemove }: FlavorRowProps): JSX.Element {
  const available = availableStock(item, lines, board.baseOf);
  const kind = kindOf(presentationOf(line));
  const chosen = line.flavors.some((flavor) => flavor.menuItemId === item.id);
  const price = flavorPrice(line, item);
  const unsellable = price === null && !inPromo;
  return (
    <li className='flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2 border-b border-zinc-100 dark:border-zinc-800'>
      <div className='min-w-0'>
        <p className='font-semibold text-zinc-900 dark:text-zinc-50'>{item.name}</p>
        <p className='text-xs text-zinc-700 dark:text-zinc-200'>
          {priceLabel(price, inPromo)} · stock {available.toLocaleString('es-AR')}
        </p>
      </div>
      <div className='flex shrink-0 gap-2'>
        {(kind !== 'single' || inPromo) && (
          <button className={removeButton} disabled={!chosen} onClick={() => onRemove(item.id)}>
            Quitar uno
          </button>
        )}
        <AddButtons id={item.id} kind={kind} free={remaining(line)} available={available} blocked={unsellable} chosen={chosen} onAdd={onAdd} />
      </div>
    </li>
  );
}
