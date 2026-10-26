import { Edit, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { CardAction, EntityCard } from '@/components/ui/entity-card';
import { SALE_PRICE_TERM } from '@/features/menu/domain/menu-terms';
import { describeComponents } from '@/features/promotion/domain/promotion-describe';
import type { PromotionDef } from '@/features/promotion/domain/promotion.schema';
import { formatMoney } from '@/lib/format-money';
import type { PromotionRowActions } from './promotion-columns';

function StatusBadge({ isActive }: { isActive: boolean }): JSX.Element {
  const tone = isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tone}`}>{isActive ? 'Activa' : 'Inactiva'}</span>;
}

function Details({ promotion }: { promotion: PromotionDef }): JSX.Element {
  return (
    <div className='flex flex-col gap-1 mt-1 text-sm'>
      <span className='text-zinc-500'>{describeComponents(promotion.components)}</span>
      <span>
        <span className='font-medium text-zinc-600 dark:text-zinc-300'>{SALE_PRICE_TERM}</span> {formatMoney(promotion.price)}
      </span>
    </div>
  );
}

function CardButtons({ promotion, actions }: { promotion: PromotionDef; actions: PromotionRowActions }): JSX.Element {
  const toggleIcon = promotion.isActive ? <ToggleRight className='w-4 h-4' /> : <ToggleLeft className='w-4 h-4' />;
  return (
    <>
      <CardAction icon={toggleIcon} label={promotion.isActive ? 'Desactivar' : 'Activar'} onClick={() => actions.onToggleActive(promotion)} variant={promotion.isActive ? 'warning' : 'success'} />
      <CardAction icon={<Edit className='w-4 h-4' />} label='Editar' onClick={() => actions.onEdit(promotion)} />
      <CardAction icon={<Trash2 className='w-4 h-4' />} label='Eliminar' onClick={() => actions.onDelete(promotion.id)} variant='danger' />
    </>
  );
}

export function renderPromotionCard(actions: PromotionRowActions): (promotion: PromotionDef) => JSX.Element {
  return function PromotionCard(promotion: PromotionDef): JSX.Element {
    return <EntityCard key={promotion.id} title={promotion.name} badges={<StatusBadge isActive={promotion.isActive} />} details={<Details promotion={promotion} />} actions={<CardButtons promotion={promotion} actions={actions} />} />;
  };
}
