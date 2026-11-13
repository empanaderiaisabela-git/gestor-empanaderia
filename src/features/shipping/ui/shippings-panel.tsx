'use client';

import { Plus } from 'lucide-react';
import type { JSX } from 'react';
import { GlobalMessage } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { TEST_IDS } from '@/constants/test-ids';
import { renderShippingCard } from './shipping-card';
import { getShippingColumns, type ShippingRowActions } from './shipping-columns';
import { ShippingFormModal } from './shipping-form-modal';
import { type ShippingsPanelModel, useShippingsPanel } from './use-shippings-panel';

function ShippingsToolbar({ model }: { model: ShippingsPanelModel }): JSX.Element {
  const { manager } = model;
  const inactive = <ToggleFilter id='showInactive-shipping' checked={model.showInactive} onChange={model.setShowInactive} label='Ver Inactivos' data-testid={TEST_IDS.general.btnVerOcultos} />;
  const add = (
    <Button variant='primary' onClick={() => manager.openFormModal()} leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
      Nuevo envío
    </Button>
  );
  return <PanelToolbar search={manager.search} onSearchChange={manager.setSearch} searchPlaceholder='Buscar envíos...' data-testid={TEST_IDS.general.inputBusquedaTabla} filters={inactive} actions={add} />;
}

export function ShippingsPanel(): JSX.Element {
  const model = useShippingsPanel();
  const { manager, actions } = model;
  if (model.initialLoading) return <TableSkeleton />;
  const rowActions: ShippingRowActions = { onEdit: (shipping) => manager.openFormModal(shipping), onToggleActive: actions.handleToggleActive, onDelete: manager.setItemToDelete };
  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <ShippingsToolbar model={model} />
      <GlobalMessage message={manager.globalMessage} />
      <ResponsivePanelView columns={getShippingColumns(rowActions)} data={model.visibleShippings} isLoading={actions.isPending} emptyMessage='Todavía no hay envíos.' renderCard={renderShippingCard(rowActions)} />
      <ShippingFormModal model={model} />
      <ConfirmModal
        isOpen={Boolean(manager.itemToDelete)}
        onClose={() => manager.setItemToDelete(null)}
        onConfirm={() => actions.handleDelete(manager.itemToDelete ?? '')}
        title='Eliminar envío'
        description='Se borra para siempre. Si ya se usó en una venta, desactivalo.'
        submitLabel='Eliminar'
        isPending={actions.isPending}
      />
    </div>
  );
}
