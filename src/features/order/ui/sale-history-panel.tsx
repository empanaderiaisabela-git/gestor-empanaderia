'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { JSX } from 'react';
import { GlobalMessage } from '@/components/ui/alert';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { TEST_IDS } from '@/constants/test-ids';
import { buyerLabel } from '@/features/order/domain/sale-history.schema';
import { formatMoney } from '@/lib/format-money';
import { getSaleHistoryColumns, renderSaleCard, type SaleRowActions } from './sale-history-columns';
import { SaleReceipt } from './sale-receipt';
import { type SaleHistoryModel, useSaleHistory } from './use-sale-history';

function Toolbar({ model }: { model: SaleHistoryModel }): JSX.Element {
  const { filters, setFilters } = model;
  const dates = <DateRangePicker startDate={filters.startDate} endDate={filters.endDate} onStartChange={(startDate) => setFilters({ startDate })} onEndChange={(endDate) => setFilters({ endDate })} />;
  const newOrder = (
    <Link href='/ventas/nueva' className='h-11 inline-flex items-center justify-center gap-2 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium shrink-0 shadow-sm' data-testid={TEST_IDS.general.btnAgregar}>
      <Plus className='w-5 h-5' /> Nuevo pedido
    </Link>
  );
  return <PanelToolbar search={filters.search} onSearchChange={(search) => setFilters({ search })} searchPlaceholder='Buscar por comprador o vendedor...' searchPlaceholderMobile='Buscar ventas...' data-testid={TEST_IDS.general.inputBusquedaTabla} filters={dates} actions={newOrder} />;
}

function VoidConfirm({ model }: { model: SaleHistoryModel }): JSX.Element {
  const sale = model.toVoid;
  const description = sale ? `¿Anular la venta de ${buyerLabel(sale.buyerName)} por ${formatMoney(sale.total)}? El stock de los gustos vuelve a su lugar. No se puede deshacer.` : '';
  return <ConfirmModal isOpen={Boolean(sale)} onClose={() => model.setToVoid(null)} onConfirm={() => void model.confirmVoid()} title='Anular venta' description={description} submitLabel='Confirmar anulación' isPending={model.pending} />;
}

export function SaleHistoryPanel(): JSX.Element {
  const model = useSaleHistory();
  if (model.loading) return <TableSkeleton />;
  if (model.receipt) return <SaleReceipt sale={model.receipt} onClose={() => model.setReceipt(null)} />;
  const actions: SaleRowActions = { isAdmin: model.isAdmin, onReceipt: model.setReceipt, onVoid: model.setToVoid };
  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <Toolbar model={model} />
      <GlobalMessage message={model.notice} />
      <ResponsivePanelView columns={getSaleHistoryColumns(actions)} data={model.sales} emptyMessage='No hay ventas que coincidan con los filtros.' renderCard={renderSaleCard(actions)} />
      <VoidConfirm model={model} />
    </div>
  );
}
