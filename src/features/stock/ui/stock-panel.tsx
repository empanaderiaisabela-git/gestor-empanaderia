'use client';

import { PackagePlus, TrendingUp } from 'lucide-react';
import { type JSX, useState } from 'react';
import { GlobalMessage } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EntityCard } from '@/components/ui/entity-card';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { TEST_IDS } from '@/constants/test-ids';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { CATEGORY_LABELS, categoryOf, hasOwnStock } from '@/features/stock/domain/stock-categories';
import { openLastEntry } from './open-last-entry';
import { getStockColumns, getStockViewColumns, StockBadge, StockButtons, type StockRowActions } from './stock-columns';
import { StockEntryEditModal } from './stock-entry-edit-modal';
import { StockEntryModal } from './stock-entry-modal';
import { StockFilters } from './stock-filters';
import { StockHistoryModal } from './stock-history-modal';
import { StockIncreaseModal } from './stock-increase-modal';
import { StockLossModal } from './stock-loss-modal';
import { StockPricingModal } from './stock-pricing-modal';
import { useStockPanel } from './use-stock-panel';

const renderCard = (actions: StockRowActions | null) =>
  function StockCard(item: MenuItemDef): JSX.Element {
    const buttons = actions && <StockButtons item={item} actions={actions} />;
    const category = CATEGORY_LABELS[categoryOf(item)];
    return <EntityCard key={item.id} title={item.isBase ? category : item.name} subtitle={item.isBase ? undefined : category} badges={<StockBadge item={item} />} actions={buttons} />;
  };

export function StockPanel(): JSX.Element {
  const model = useStockPanel();
  const isAdmin = useAuthStore((state) => state.user?.role) === 'admin';
  const [increaseOpen, setIncreaseOpen] = useState(false);
  if (model.loading) return <TableSkeleton />;
  const editLast = (item: MenuItemDef): void => void openLastEntry(item, model.setDialog);
  const actions: StockRowActions | null = isAdmin ? { open: model.setDialog, editLast } : null;
  const editing = model.dialog?.kind === 'entry' && model.dialog.item && model.dialog.entry ? { item: model.dialog.item, entry: model.dialog.entry } : null;
  const addButton = (
    <Button variant='primary' onClick={() => model.setDialog({ kind: 'entry', item: null })} leftIcon={<PackagePlus className='w-5 h-5' />} className='h-11 w-full sm:w-auto shrink-0' data-testid={TEST_IDS.general.btnAgregar}>
      Ingresar stock
    </Button>
  );
  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <PanelToolbar search={model.search} onSearchChange={model.setSearch} searchPlaceholder='Buscar gusto o bebida...' searchPlaceholderMobile='Buscar...' data-testid={TEST_IDS.general.inputBusquedaTabla} filters={<StockFilters model={model} isAdmin={isAdmin} />} actions={actions && (
          <div className='flex flex-col gap-2 w-full sm:w-auto'>
            <Button variant='secondary' onClick={() => setIncreaseOpen(true)} leftIcon={<TrendingUp className='w-5 h-5' />} className='h-11 w-full sm:w-auto shrink-0 bg-zinc-900! text-white! border-zinc-900! hover:bg-zinc-700! dark:bg-white! dark:text-zinc-900! dark:border-white! dark:hover:bg-zinc-200!'>
              Registrar aumento
            </Button>
            {addButton}
          </div>
        )} />
      <GlobalMessage message={model.message} />
      <ResponsivePanelView columns={actions ? getStockColumns(actions) : getStockViewColumns()} data={actions ? model.items : model.items.filter(hasOwnStock)} emptyMessage='No hay gustos ni bebidas activos en esta categoría.' renderCard={renderCard(actions)} />
      <StockEntryModal model={model} />
      <StockLossModal model={model} />
      <StockPricingModal model={model} />
      <StockHistoryModal model={model} />
      <StockIncreaseModal model={model} isOpen={increaseOpen} onClose={() => setIncreaseOpen(false)} />
      {editing && <StockEntryEditModal key={editing.entry.id} model={model} item={editing.item} entry={editing.entry} />}
    </div>
  );
}
