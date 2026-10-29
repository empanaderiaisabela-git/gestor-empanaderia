import { Edit, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { CardAction, EntityCard } from '@/components/ui/entity-card';
import { describePlans } from '@/features/card/domain/card-describe';
import type { CardDef } from '@/features/card/domain/card.schema';
import type { CardRowActions } from './card-columns';

function StatusBadge({ isActive }: { isActive: boolean }): JSX.Element {
  const tone = isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200';
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tone}`}>{isActive ? 'Activa' : 'Inactiva'}</span>;
}

function CardButtons({ card, actions }: { card: CardDef; actions: CardRowActions }): JSX.Element {
  const toggleIcon = card.isActive ? <ToggleRight className='w-4 h-4' /> : <ToggleLeft className='w-4 h-4' />;
  return (
    <>
      <CardAction icon={toggleIcon} label={card.isActive ? 'Desactivar' : 'Activar'} onClick={() => actions.onToggleActive(card)} variant={card.isActive ? 'warning' : 'success'} />
      <CardAction icon={<Edit className='w-4 h-4' />} label='Editar' onClick={() => actions.onEdit(card)} />
      <CardAction icon={<Trash2 className='w-4 h-4' />} label='Eliminar' onClick={() => actions.onDelete(card.id)} variant='danger' />
    </>
  );
}

export function renderCardCard(actions: CardRowActions): (card: CardDef) => JSX.Element {
  return function CardCard(card: CardDef): JSX.Element {
    const details = <span className='mt-1 text-sm text-zinc-700 dark:text-zinc-200'>{describePlans(card.plans)}</span>;
    return <EntityCard key={card.id} title={card.name} badges={<StatusBadge isActive={card.isActive} />} details={details} actions={<CardButtons card={card} actions={actions} />} />;
  };
}
