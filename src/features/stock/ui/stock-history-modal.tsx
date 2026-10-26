'use client';

import { History } from 'lucide-react';
import { type JSX, useEffect, useState } from 'react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { fetchStockEntries } from '@/features/stock/actions/fetch-stock-entries';
import { COST_TERM } from '@/features/menu/domain/menu-terms';
import type { StockEntryDef } from '@/features/stock/domain/stock.schema';
import { formatDateTime } from '@/lib/format-date-time';
import { formatMoney } from '@/lib/format-money';
import type { StockPanelModel } from './use-stock-panel';

function EntryRow({ entry, isAdmin }: { entry: StockEntryDef; isAdmin: boolean }): JSX.Element {
  const costs = isAdmin ? ` · ${COST_TERM} ${entry.unitCost === null ? '—' : formatMoney(entry.unitCost)} · ${entry.providerName ?? 'Sin proveedor'}` : '';
  return (
    <li className='flex justify-between gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 text-sm'>
      <span className='text-zinc-500'>{formatDateTime(entry.createdAt)}</span>
      <span className='text-right'>
        <strong>+{entry.quantity}</strong>
        {costs} · {entry.username}
      </span>
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
      {entries === null && <p className='text-sm text-zinc-500'>Cargando...</p>}
      {entries?.length === 0 && <p className='text-sm text-zinc-500'>Todavía no hay ingresos de stock para este producto.</p>}
      <ul>
        {entries?.map((entry) => (
          <EntryRow key={entry.id} entry={entry} isAdmin={model.isAdmin} />
        ))}
      </ul>
    </ResponsiveModal>
  );
}
