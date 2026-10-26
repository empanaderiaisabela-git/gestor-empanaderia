import { Edit, Plus, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import type { ColumnDef } from '@/components/ui/virtualized-data-table';
import { describePlans } from '@/features/card/domain/card-describe';
import type { CardDef } from '@/features/card/domain/card.schema';

export type CardRowActions = {
  onEdit: (card: CardDef) => void;
  onToggleActive: (card: CardDef) => void;
  onDelete: (id: string) => void;
};

function NameCell({ card }: { card: CardDef }): JSX.Element {
  return (
    <div className='flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 truncate min-w-0' title={card.name}>
      <span className='truncate'>{card.name}</span>
      {!card.isActive && <span className='shrink-0 px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase'>Inactiva</span>}
    </div>
  );
}

export function CardRowButtons({ card, actions }: { card: CardDef; actions: CardRowActions }): JSX.Element {
  const toggleClass = card.isActive ? 'text-amber-700 hover:bg-amber-50 dark:text-amber-400' : 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400';
  return (
    <>
      <button onClick={() => actions.onToggleActive(card)} className={`p-1.5 rounded-lg transition ${toggleClass}`} title={card.isActive ? 'Desactivar' : 'Activar'}>
        <Plus className={`w-4 h-4 ${card.isActive ? 'rotate-45' : ''}`} />
      </button>
      <button onClick={() => actions.onEdit(card)} className='p-1.5 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition' title='Editar'>
        <Edit className='w-4 h-4' />
      </button>
      <button onClick={() => actions.onDelete(card.id)} className='p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition' title='Eliminar'>
        <Trash2 className='w-4 h-4' />
      </button>
    </>
  );
}

export function getCardColumns(actions: CardRowActions): ColumnDef<CardDef>[] {
  return [
    { header: 'Tarjeta', cellClassName: 'max-w-[220px]', cell: (card) => <NameCell card={card} /> },
    { header: 'Planes de cuotas', cellClassName: 'text-zinc-600 dark:text-zinc-300 text-sm', cell: (card) => describePlans(card.plans) },
    { header: 'Acciones', headerClassName: 'text-right', cellClassName: 'flex gap-1 justify-end', cell: (card) => <CardRowButtons card={card} actions={actions} /> },
  ];
}
