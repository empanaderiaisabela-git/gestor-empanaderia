'use client';

import { type JSX, useState } from 'react';
import { inputClass } from '@/components/ui/form-field';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { visibleFlavors } from '@/features/order/domain/flavor-list';
import { describeFlavors, missingLabel } from '@/features/order/domain/order-describe';
import type { AddMode } from '@/features/order/domain/order-line';
import { useOrderStore } from '@/features/order/store/order.store';
import { AddedToast, useAddedToast } from './added-toast';
import { FlavorRow } from './flavor-row';
import type { OrderBoardModel } from './use-order-board';
import { usePickerTarget } from './use-picker-target';

export function FlavorPicker({ board }: { board: OrderBoardModel }): JSX.Element {
  const close = useOrderStore((state) => state.close);
  const target = usePickerTarget();
  const [search, setSearch] = useState('');
  const toast = useAddedToast();
  const line = target?.line;
  const progress = line && line.flavors.length > 0 ? `${describeFlavors(line, board.nameOf)} · ${missingLabel(line) ?? 'completa'}` : null;
  const flavors = target ? visibleFlavors(board.itemsOf(target.line.group), target.line, search) : [];
  const done = (): void => {
    setSearch('');
    close();
  };
  const add = (menuItemId: string, mode: AddMode): void => {
    target?.add(menuItemId, mode);
    toast.notify(board.nameOf(menuItemId));
  };
  return (
    <ResponsiveModal isOpen={Boolean(target)} onClose={done} title={target?.title ?? ''} width='md'>
      {progress && <p className='mb-3 text-sm font-semibold text-brand-700 dark:text-brand-300'>{progress}</p>}
      <input type='search' aria-label='Buscar gusto' placeholder='Buscar gusto...' value={search} onChange={(event) => setSearch(event.target.value)} className={inputClass(false)} />
      <ul aria-label='Gustos'>
        {target && flavors.map((item) => <FlavorRow key={item.id} line={target.line} lines={target.usage} item={item} board={board} inPromo={target.inPromo} onAdd={add} />)}
      </ul>
      {target && flavors.length === 0 && <p className='py-4 text-sm text-zinc-700 dark:text-zinc-200'>Ningún gusto coincide.</p>}
      <button onClick={done} className='mt-4 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 py-2 font-semibold'>
        Listo
      </button>
      <AddedToast name={toast.added} />
    </ResponsiveModal>
  );
}
