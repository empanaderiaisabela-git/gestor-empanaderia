'use client';

import { PackagePlus } from 'lucide-react';
import type { JSX } from 'react';
import { GlobalMessage } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EntityCard } from '@/components/ui/entity-card';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { TEST_IDS } from '@/constants/test-ids';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { GROUPS, MENU_GROUPS, type MenuGroup } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { getStockColumns, getStockViewColumns, StockBadge, StockButtons, type StockRowActions } from './stock-columns';
import { StockEntryModal } from './stock-entry-modal';
import { StockHistoryModal } from './stock-history-modal';
import { StockLossModal } from './stock-loss-modal';
import { StockPricingModal } from './stock-pricing-modal';
import { type StockPanelModel, useStockPanel } from './use-stock-panel';

const isGroup = (value: string): value is MenuGroup => MENU_GROUPS.some((group) => group === value);

function GroupFilter({ model }: { model: StockPanelModel }): JSX.Element {
  return (
    <select aria-label='Filtrar por grupo' value={model.groupFilter} onChange={(event) => model.setGroupFilter(isGroup(event.target.value) ? event.target.value : 'todos')} className='h-11 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm'>
      <option value='todos'>Todos los grupos</option>
      {MENU_GROUPS.map((group) => (
        <option key={group} value={group}>
          {GROUPS[group].label}
        </option>
      ))}
    </select>
  );
}

const renderCard = (actions: StockRowActions | null) =>
  function StockCard(item: MenuItemDef): JSX.Element {
    const buttons = actions && <StockButtons item={item} actions={actions} />;
    return <EntityCard key={item.id} title={item.name} subtitle={GROUPS[item.group].label} badges={<StockBadge item={item} />} actions={buttons} />;
  };

export function StockPanel(): JSX.Element {
  const model = useStockPanel();
  const isAdmin = useAuthStore((state) => state.user?.role) === 'admin';
  if (model.loading) return <TableSkeleton />;
  const actions: StockRowActions | null = isAdmin ? { open: model.setDialog } : null;
  const addButton = (
    <Button variant='primary' onClick={() => model.setDialog({ kind: 'entry', item: null })} leftIcon={<PackagePlus className='w-5 h-5' />} className='h-11 w-full sm:w-auto shrink-0' data-testid={TEST_IDS.general.btnAgregar}>
      Ingresar stock
    </Button>
  );
  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <PanelToolbar search={model.search} onSearchChange={model.setSearch} searchPlaceholder='Buscar gusto o bebida...' searchPlaceholderMobile='Buscar...' data-testid={TEST_IDS.general.inputBusquedaTabla} filters={<GroupFilter model={model} />} actions={actions && addButton} />
      <GlobalMessage message={model.message} />
      <ResponsivePanelView columns={actions ? getStockColumns(actions) : getStockViewColumns()} data={model.items} emptyMessage='No hay gustos ni bebidas activos en este grupo.' renderCard={renderCard(actions)} />
      <StockEntryModal model={model} />
      <StockLossModal model={model} />
      <StockPricingModal model={model} />
      <StockHistoryModal model={model} />
    </div>
  );
}
