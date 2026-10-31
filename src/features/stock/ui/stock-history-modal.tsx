'use client';

import { History, Pencil } from 'lucide-react';
import { type JSX, useEffect, useState } from 'react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { fetchStockEntries } from '@/features/stock/actions/fetch-stock-entries';
import { COST_TERM } from '@/features/menu/domain/menu-terms';
import type { StockEntryDef } from '@/features/stock/domain/stock.schema';
import { formatDateTime } from '@/lib/format-date-time';
import { formatMoney } from '@/lib/format-money';
import type { StockPanelModel } from './use-stock-panel';

function EntryRow({ entry, onEdit }: { entry: StockEntryDef; onEdit: () => void }): JSX.Element {
  const costs = ` · ${COST_TERM} ${entry.unitCost === null ? '—' : formatMoney(entry.unitCost)} · ${entry.providerName ?? 'Sin proveedor'}`;
  return (
    <li className='flex justify-between gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 text-sm'>
      <span className='text-zinc-700 dark:text-zinc-200'>{formatDateTime(entry.createdAt)}</span>
      <span className='text-right'>
        <strong>+{entry.quantity}</strong>
        {costs} · {entry.username}
      </span>
      <button type='button' onClick={onEdit} title='Editar ingreso' className='p-1.5 rounded-lg text-brand-600 hover:bg-zinc-100 dark:text-brand-400 dark:hover:bg-zinc-800'>
        <Pencil className='w-4 h-4' />
      </button>
    </li>
  );
}

export function StockHistoryModal({ model }: { model: StockPanelModel }): JSX.Element {
  const item = model.dialog?.kind === 'history' ? model.dialog.item : null;
  const [entries, setEntries] = useState<StockEntryDef[] | null>(null);

  useEffect(() => {
    setEntries(null);
    if (item) fetchStockEntries(item.id).then(setEntries);
  }, [item]);

  return (
    <ResponsiveModal isOpen={Boolean(item)} onClose={() => model.setDialog(null)} title={`Historial de ingresos · ${item?.name ?? ''}`} icon={<History className='w-5 h-5 text-brand-500' />} width='md'>
      {entries === null && <p className='text-sm text-zinc-700 dark:text-zinc-200'>Cargando...</p>}
      {entries?.length === 0 && <p className='text-sm text-zinc-700 dark:text-zinc-200'>Todavía no hay ingresos de stock para este producto.</p>}
      <ul>
        {entries?.map((entry) => (
          <EntryRow key={entry.id} entry={entry} onEdit={() => model.setDialog({ kind: 'entry', item, entry })} />
        ))}
      </ul>
    </ResponsiveModal>
  );
}
