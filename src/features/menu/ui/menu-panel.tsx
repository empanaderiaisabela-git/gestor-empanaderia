'use client';

import type { JSX } from 'react';
import { GlobalMessage } from '@/components/ui/alert';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { GROUP_PRICED } from '@/features/menu/domain/menu-groups';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { GroupPriceCard } from './group-price-card';
import { renderMenuItemCard } from './menu-item-card';
import { getMenuItemColumns, type MenuItemRowActions } from './menu-item-columns';
import { MenuItemFormModal } from './menu-item-form-modal';
import { MenuPhotosModal } from './menu-photos-modal';
import { MenuToolbar } from './menu-toolbar';
import { useMenuCatalog } from './use-menu-catalog';
import { type MenuPanelModel, useMenuPanel } from './use-menu-panel';

function GroupPrices({ model }: { model: MenuPanelModel }): JSX.Element {
  const groupPrices = useMenuStore((state) => state.groupPrices);
  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 shrink-0'>
      {GROUP_PRICED.map((group) => (
        <GroupPriceCard key={group} group={group} current={groupPrices.find((row) => row.group === group)} onSave={model.saveGroupPrices} />
      ))}
    </div>
  );
}

function DeleteConfirm({ model: { manager, actions } }: { model: MenuPanelModel }): JSX.Element {
  return (
    <ConfirmModal
      isOpen={Boolean(manager.itemToDelete)}
      onClose={() => manager.setItemToDelete(null)}
      onConfirm={() => actions.handleDelete(manager.itemToDelete ?? '')}
      title='Eliminar producto'
      description='Se borra para siempre. Si ya tiene ventas o movimientos de stock no se puede borrar: desactivalo.'
      submitLabel='Eliminar'
      isPending={actions.isPending}
    />
  );
}

export function MenuPanel(): JSX.Element {
  const model = useMenuPanel();
  const { manager, actions } = model;
  const catalog = useMenuCatalog(manager.showGlobalMessage);

  if (model.initialLoading) {
    return (
      <div className='mt-8 animate-in fade-in duration-500'>
        <TableSkeleton />
      </div>
    );
  }

  const rowActions: MenuItemRowActions = { onEdit: (item) => manager.openFormModal(item), onToggleActive: actions.handleToggleActive, onDelete: manager.setItemToDelete, onToggleVisible: (item) => void catalog.toggleVisible(item), onPhotos: catalog.setPhotosOf };

  return (
    <div className='flex flex-col flex-1 h-full overflow-y-auto'>
      <GlobalMessage message={manager.globalMessage} />
      <GroupPrices model={model} />
      <MenuToolbar model={model} />
      <ResponsivePanelView
        columns={getMenuItemColumns(rowActions)}
        data={model.visibleItems}
        isLoading={actions.isPending}
        emptyMessage='Todavía no hay gustos ni bebidas cargados en este grupo.'
        renderCard={renderMenuItemCard(rowActions)}
      />
      <MenuItemFormModal model={model} />
      <MenuPhotosModal item={catalog.photosOf} onClose={() => catalog.setPhotosOf(null)} />
      <DeleteConfirm model={model} />
    </div>
  );
}
