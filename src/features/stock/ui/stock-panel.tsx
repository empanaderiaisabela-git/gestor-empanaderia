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
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { CATEGORY_LABELS, categoryOf, hasOwnStock, isStockCategory, STOCK_CATEGORIES, STOCKED_CATEGORIES } from '@/features/stock/domain/stock-categories';
import { getStockColumns, getStockViewColumns, StockBadge, StockButtons, type StockRowActions } from './stock-columns';
import { StockEntryModal } from './stock-entry-modal';
import { StockHistoryModal } from './stock-history-modal';
import { StockLossModal } from './stock-loss-modal';
import { StockPricingModal } from './stock-pricing-modal';
import { type StockPanelModel, useStockPanel } from './use-stock-panel';

function CategoryFilter({ model, isAdmin }: { model: StockPanelModel; isAdmin: boolean }): JSX.Element {
  return (
    <select aria-label='Filtrar Stock' value={model.categoryFilter} onChange={(event) => model.setCategoryFilter(isStockCategory(event.target.value) ? event.target.value : 'todos')} className='h-11 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm'>
      <option value='todos'>Todas las categorías</option>
      {(isAdmin ? STOCK_CATEGORIES : STOCKED_CATEGORIES).map((category) => (
        <option key={category} value={category}>
          {CATEGORY_LABELS[category]}
        </option>
      ))}
    </select>
  );
}

const renderCard = (actions: StockRowActions | null) =>
  function StockCard(item: MenuItemDef): JSX.Element {
    const buttons = actions && <StockButtons item={item} actions={actions} />;
    const category = CATEGORY_LABELS[categoryOf(item)];
    return <EntityCard key={item.id} title={item.isBase ? category : item.name} subtitle={item.isBase ? undefined : category} badges={<StockBadge item={item} />} actions={buttons} />;
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
      <PanelToolbar search={model.search} onSearchChange={model.setSearch} searchPlaceholder='Buscar gusto o bebida...' searchPlaceholderMobile='Buscar...' data-testid={TEST_IDS.general.inputBusquedaTabla} filters={<CategoryFilter model={model} isAdmin={isAdmin} />} actions={actions && addButton} />
      <GlobalMessage message={model.message} />
      <ResponsivePanelView columns={actions ? getStockColumns(actions) : getStockViewColumns()} data={actions ? model.items : model.items.filter(hasOwnStock)} emptyMessage='No hay gustos ni bebidas activos en esta categoría.' renderCard={renderCard(actions)} />
      <StockEntryModal model={model} />
      <StockLossModal model={model} />
      <StockPricingModal model={model} />
      <StockHistoryModal model={model} />
    </div>
  );
}
