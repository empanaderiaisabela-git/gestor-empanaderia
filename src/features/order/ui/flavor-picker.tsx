'use client';

import type { JSX } from 'react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { describeFlavors, missingLabel } from '@/features/order/domain/order-describe';
import { useOrderStore } from '@/features/order/store/order.store';
import { FlavorRow } from './flavor-row';
import type { OrderBoardModel } from './use-order-board';
import { usePickerTarget } from './use-picker-target';

export function FlavorPicker({ board }: { board: OrderBoardModel }): JSX.Element {
  const close = useOrderStore((state) => state.close);
  const target = usePickerTarget();
  const line = target?.line;
  const progress = line && line.flavors.length > 0 ? `${describeFlavors(line, board.nameOf)} · ${missingLabel(line) ?? 'completa'}` : null;
  return (
    <ResponsiveModal isOpen={Boolean(target)} onClose={close} title={target?.title ?? ''} width='md'>
      {progress && <p className='mb-3 text-sm font-semibold text-brand-700 dark:text-brand-300'>{progress}</p>}
      <ul aria-label='Gustos'>
        {target &&
          board.itemsOf(target.line.group).map((item) => (
            <FlavorRow key={item.id} line={target.line} lines={target.usage} item={item} board={board} inPromo={target.inPromo} onAdd={target.add} />
          ))}
      </ul>
      <button onClick={close} className='mt-4 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 py-2 font-semibold'>
        Listo
      </button>
    </ResponsiveModal>
  );
}
