import { Edit, Plus, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import type { ColumnDef } from '@/components/ui/virtualized-data-table';
import type { ShippingDef } from '@/features/shipping/domain/shipping.schema';
import { formatMoney } from '@/lib/format-money';

export type ShippingRowActions = { onEdit: (shipping: ShippingDef) => void; onToggleActive: (shipping: ShippingDef) => void; onDelete: (id: string) => void };

function TitleCell({ shipping }: { shipping: ShippingDef }): JSX.Element {
  return (
    <div className='flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50 min-w-0' title={shipping.title}>
      <span className='truncate'>{shipping.title}</span>
      {!shipping.isActive && <span className='shrink-0 px-1.5 py-0.5 bg-zinc-100 text-zinc-700 dark:text-zinc-200 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase'>Inactivo</span>}
    </div>
  );
}

function RowButtons({ shipping, actions }: { shipping: ShippingDef; actions: ShippingRowActions }): JSX.Element {
  const toggleClass = shipping.isActive ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10' : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10';
  return (
    <>
      <button onClick={() => actions.onToggleActive(shipping)} className={`p-1.5 rounded-lg transition ${toggleClass}`} title={shipping.isActive ? 'Desactivar' : 'Activar'}>
        <Plus className={`w-4 h-4 ${shipping.isActive ? 'rotate-45' : ''}`} />
      </button>
      <button onClick={() => actions.onEdit(shipping)} className='p-1.5 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition' title='Editar'>
        <Edit className='w-4 h-4' />
      </button>
      <button onClick={() => actions.onDelete(shipping.id)} className='p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition' title='Eliminar'>
        <Trash2 className='w-4 h-4' />
      </button>
    </>
  );
}

export function getShippingColumns(actions: ShippingRowActions): ColumnDef<ShippingDef>[] {
  return [
    { header: 'Título', cellClassName: 'max-w-[220px]', cell: (shipping) => <TitleCell shipping={shipping} /> },
    { header: 'Detalle', cellClassName: 'text-zinc-700 dark:text-zinc-200 max-w-[320px] truncate', cell: (shipping) => <span title={shipping.detail}>{shipping.detail || '—'}</span> },
    { header: 'Monto', cellClassName: 'font-semibold', cell: (shipping) => formatMoney(shipping.amount) },
    { header: 'Acciones', headerClassName: 'text-right', cellClassName: 'flex gap-1 justify-end', cell: (shipping) => <RowButtons shipping={shipping} actions={actions} /> },
  ];
}
