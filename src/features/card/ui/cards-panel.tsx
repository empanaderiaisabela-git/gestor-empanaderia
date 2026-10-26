'use client';

import type { JSX } from 'react';
import { GlobalMessage } from '@/components/ui/alert';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { renderCardCard } from './card-card';
import { type CardRowActions, getCardColumns } from './card-columns';
import { CardFormModal } from './card-form-modal';
import { CardsToolbar } from './cards-toolbar';
import { useCardsPanel } from './use-cards-panel';

export function CardsPanel(): JSX.Element {
  const model = useCardsPanel();
  const { manager, actions } = model;

  if (model.initialLoading) {
    return (
      <div className='mt-8 animate-in fade-in duration-500'>
        <TableSkeleton />
      </div>
    );
  }

  const rowActions: CardRowActions = { onEdit: (card) => manager.openFormModal(card), onToggleActive: actions.handleToggleActive, onDelete: manager.setItemToDelete };

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <CardsToolbar model={model} />
      <GlobalMessage message={manager.globalMessage} />
      <ResponsivePanelView columns={getCardColumns(rowActions)} data={model.visibleCards} isLoading={actions.isPending} emptyMessage='Todavía no hay tarjetas.' renderCard={renderCardCard(rowActions)} />
      <CardFormModal model={model} />
      <ConfirmModal
        isOpen={Boolean(manager.itemToDelete)}
        onClose={() => manager.setItemToDelete(null)}
        onConfirm={() => actions.handleDelete(manager.itemToDelete ?? '')}
        title='Eliminar tarjeta'
        description='Se borra para siempre. Si ya se usó en un cobro, no se puede borrar: desactivala.'
        submitLabel='Eliminar'
        isPending={actions.isPending}
      />
    </div>
  );
}
