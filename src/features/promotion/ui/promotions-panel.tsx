'use client';

import type { JSX } from 'react';
import { GlobalMessage } from '@/components/ui/alert';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { renderPromotionCard } from './promotion-card';
import { getPromotionColumns, type PromotionRowActions } from './promotion-columns';
import { PromotionFormModal } from './promotion-form-modal';
import { PromotionsToolbar } from './promotions-toolbar';
import { usePromotionsPanel } from './use-promotions-panel';

export function PromotionsPanel(): JSX.Element {
  const model = usePromotionsPanel();
  const { manager, actions } = model;

  if (model.initialLoading) {
    return (
      <div className='mt-8 animate-in fade-in duration-500'>
        <TableSkeleton />
      </div>
    );
  }

  const rowActions: PromotionRowActions = { onEdit: (promotion) => manager.openFormModal(promotion), onToggleActive: actions.handleToggleActive, onDelete: manager.setItemToDelete };

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <PromotionsToolbar model={model} />
      <GlobalMessage message={manager.globalMessage} />
      <ResponsivePanelView columns={getPromotionColumns(rowActions)} data={model.visiblePromotions} isLoading={actions.isPending} emptyMessage='Todavía no hay promociones.' renderCard={renderPromotionCard(rowActions)} />
      <PromotionFormModal model={model} />
      <ConfirmModal
        isOpen={Boolean(manager.itemToDelete)}
        onClose={() => manager.setItemToDelete(null)}
        onConfirm={() => actions.handleDelete(manager.itemToDelete ?? '')}
        title='Eliminar promoción'
        description='Se borra para siempre. Si ya se vendió, no se puede borrar: desactivala.'
        submitLabel='Eliminar'
        isPending={actions.isPending}
      />
    </div>
  );
}
