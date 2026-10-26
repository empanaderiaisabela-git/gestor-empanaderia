import { Edit, Plus, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import type { ColumnDef } from '@/components/ui/virtualized-data-table';
import { SALE_PRICE_TERM } from '@/features/menu/domain/menu-terms';
import { describeComponents } from '@/features/promotion/domain/promotion-describe';
import type { PromotionDef } from '@/features/promotion/domain/promotion.schema';
import { formatMoney } from '@/lib/format-money';

export type PromotionRowActions = {
  onEdit: (promotion: PromotionDef) => void;
  onToggleActive: (promotion: PromotionDef) => void;
  onDelete: (id: string) => void;
};

function NameCell({ promotion }: { promotion: PromotionDef }): JSX.Element {
  return (
    <div className='flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 truncate min-w-0' title={promotion.name}>
      <span className='truncate'>{promotion.name}</span>
      {!promotion.isActive && <span className='shrink-0 px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase'>Inactiva</span>}
    </div>
  );
}

export function PromotionRowButtons({ promotion, actions }: { promotion: PromotionDef; actions: PromotionRowActions }): JSX.Element {
  const toggleClass = promotion.isActive ? 'text-amber-700 hover:bg-amber-50 dark:text-amber-400' : 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400';
  return (
    <>
      <button onClick={() => actions.onToggleActive(promotion)} className={`p-1.5 rounded-lg transition ${toggleClass}`} title={promotion.isActive ? 'Desactivar' : 'Activar'}>
        <Plus className={`w-4 h-4 ${promotion.isActive ? 'rotate-45' : ''}`} />
      </button>
      <button onClick={() => actions.onEdit(promotion)} className='p-1.5 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition' title='Editar'>
        <Edit className='w-4 h-4' />
      </button>
      <button onClick={() => actions.onDelete(promotion.id)} className='p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition' title='Eliminar'>
        <Trash2 className='w-4 h-4' />
      </button>
    </>
  );
}

export function getPromotionColumns(actions: PromotionRowActions): ColumnDef<PromotionDef>[] {
  return [
    { header: 'Promoción', cellClassName: 'max-w-[220px]', cell: (promotion) => <NameCell promotion={promotion} /> },
    { header: 'Contenido', cellClassName: 'text-zinc-600 dark:text-zinc-300 text-sm', cell: (promotion) => describeComponents(promotion.components) },
    { header: SALE_PRICE_TERM, cellClassName: 'font-bold text-zinc-900 dark:text-zinc-100', cell: (promotion) => formatMoney(promotion.price) },
    { header: 'Acciones', headerClassName: 'text-right', cellClassName: 'flex gap-1 justify-end', cell: (promotion) => <PromotionRowButtons promotion={promotion} actions={actions} /> },
  ];
}
