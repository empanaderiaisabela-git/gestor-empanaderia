'use client';

import type { JSX } from 'react';
import { GlobalMessage } from '@/components/ui/alert';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { renderProviderCard } from './provider-card';
import { getProviderColumns, type ProviderRowActions } from './provider-columns';
import { ProviderFormModal } from './provider-form-modal';
import { ProvidersToolbar } from './providers-toolbar';
import { useProvidersPanel } from './use-providers-panel';

export function ProvidersPanel(): JSX.Element {
  const model = useProvidersPanel();
  const { role, manager, actions } = model;

  if (model.initialLoading) {
    return (
      <div className='mt-8 animate-in fade-in duration-500'>
        <TableSkeleton />
      </div>
    );
  }

  const rowActions: ProviderRowActions = { role, onEdit: (provider) => manager.openFormModal(provider), onToggleActive: actions.handleToggleActive, onDelete: manager.setItemToDelete };

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <ProvidersToolbar model={model} />
      <GlobalMessage message={manager.globalMessage} />
      <ResponsivePanelView
        columns={getProviderColumns(rowActions)}
        data={model.visibleProviders}
        isLoading={actions.isPending}
        emptyMessage='No se han encontrado proveedores.'
        renderCard={renderProviderCard(rowActions)}
      />
      <ProviderFormModal model={model} />
      <ConfirmModal
        isOpen={Boolean(manager.itemToDelete)}
        onClose={() => manager.setItemToDelete(null)}
        onConfirm={() => actions.handleDelete(manager.itemToDelete ?? '')}
        title='Eliminar Firma Proveedor'
        description='Esta acción es permanente y eliminará el registro físico de la base de datos. Solo recomendado si lo creaste por error y aún no tiene ingresos de stock asociados.'
        submitLabel='Desvincular'
        isPending={actions.isPending}
      />
    </div>
  );
}
