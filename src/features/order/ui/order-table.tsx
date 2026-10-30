import type { JSX } from 'react';
import type { OrderLine } from '@/features/order/domain/order-line';
import type { PromoLine } from '@/features/order/domain/promo-line';
import { OrderLineRow } from './order-line-row';
import { PromoLineRow, type PromoRowActions } from './promo-line-row';
import type { OrderBoardModel } from './use-order-board';

type OrderTableProps = { lines: OrderLine[]; promos?: PromoLine[]; board: OrderBoardModel; onRemove: (lineId: string) => void; onRemoveOne: (lineId: string) => void; promoActions?: PromoRowActions };

const NO_PROMO_ACTIONS: PromoRowActions = { onRemove: () => undefined, onReopen: () => undefined };

export function OrderTable({ lines, promos = [], board, onRemove, onRemoveOne, promoActions = NO_PROMO_ACTIONS }: OrderTableProps): JSX.Element {
  if (lines.length === 0 && promos.length === 0) return <p className='py-6 text-center text-sm font-semibold uppercase text-zinc-600 dark:text-zinc-300'>No hay productos en el pedido</p>;
  return (
    <table className='w-full text-left'>
      <thead className='text-xs uppercase text-zinc-700 dark:text-zinc-200'>
        <tr>
          <th className='pb-2 pr-3'>Comida</th>
          <th className='pb-2 px-3 whitespace-nowrap'>Cantidad</th>
          <th className='pb-2 px-3 whitespace-nowrap'>Unidades</th>
          <th className='pb-2 px-3 text-right'>Importe</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <OrderLineRow key={line.id} line={line} board={board} onRemove={onRemove} onRemoveOne={onRemoveOne} />
        ))}
        {promos.map((promo) => (
          <PromoLineRow key={promo.id} promo={promo} board={board} actions={promoActions} />
        ))}
      </tbody>
    </table>
  );
}
