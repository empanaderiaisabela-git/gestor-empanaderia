import type { JSX } from 'react';
import type { OrderLine } from '@/features/order/domain/order-line';
import { OrderLineRow } from './order-line-row';
import type { OrderBoardModel } from './use-order-board';

type OrderTableProps = { lines: OrderLine[]; board: OrderBoardModel; onRemove: (lineId: string) => void };

export function OrderTable({ lines, board, onRemove }: OrderTableProps): JSX.Element {
  if (lines.length === 0) return <p className='py-6 text-center text-sm font-semibold uppercase text-zinc-400'>No hay productos en el pedido</p>;
  return (
    <table className='w-full text-left'>
      <thead className='text-xs uppercase text-zinc-500'>
        <tr>
          <th className='pb-2'>Comida</th>
          <th className='pb-2'>Cantidad</th>
          <th className='pb-2'>Unidades</th>
          <th className='pb-2 text-right'>Importe</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <OrderLineRow key={line.id} line={line} board={board} onRemove={onRemove} />
        ))}
      </tbody>
    </table>
  );
}
