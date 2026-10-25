'use client';

import type { JSX } from 'react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { GROUPS } from '@/features/menu/domain/menu-groups';
import { describeFlavors, missingLabel } from '@/features/order/domain/order-describe';
import { presentationOf } from '@/features/order/domain/order-line';
import { useOrderStore } from '@/features/order/store/order.store';
import { FlavorRow } from './flavor-row';
import type { OrderBoardModel } from './use-order-board';

export function FlavorPicker({ board }: { board: OrderBoardModel }): JSX.Element {
  const { lines, openLineId, add, close } = useOrderStore();
  const line = lines.find((candidate) => candidate.id === openLineId);
  const title = line ? `${GROUPS[line.group].label} · ${presentationOf(line)?.label ?? ''}` : '';
  const progress = line && line.flavors.length > 0 ? `${describeFlavors(line, board.nameOf)} · ${missingLabel(line) ?? 'completa'}` : null;
  return (
    <ResponsiveModal isOpen={Boolean(line)} onClose={close} title={title} width='md'>
      {progress && <p className='mb-3 text-sm font-semibold text-brand-700 dark:text-brand-300'>{progress}</p>}
      <ul aria-label='Gustos'>
        {line &&
          board.itemsOf(line.group).map((item) => (
            <FlavorRow key={item.id} line={line} lines={lines} item={item} board={board} onAdd={add} />
          ))}
      </ul>
      <button onClick={close} className='mt-4 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 py-2 font-semibold'>
        Listo
      </button>
    </ResponsiveModal>
  );
}
