'use client';

import { Plus } from 'lucide-react';
import type { JSX } from 'react';
import { GlobalMessage } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ConfirmModal } from '@/components/ui/responsive-modal';
import { ResponsivePanelView } from '@/components/ui/responsive-panel-view';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { TEST_IDS } from '@/constants/test-ids';
import { renderExpenseCard } from './expense-card';
import { type ExpenseRowActions, getExpenseColumns } from './expense-columns';
import { ExpenseFormModal } from './expense-form-modal';
import { type ExpensesPanelModel, useExpensesPanel } from './use-expenses-panel';

function ExpensesToolbar({ model }: { model: ExpensesPanelModel }): JSX.Element {
  const { manager, actions, dates, setDates } = model;
  const range = <DateRangePicker startDate={dates.start} endDate={dates.end} onStartChange={(start) => setDates({ ...dates, start })} onEndChange={(end) => setDates({ ...dates, end })} onClear={() => setDates({ start: '', end: '' })} />;
  const add = (
    <Button variant='primary' onClick={() => manager.openFormModal()} leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
      Nuevo gasto
    </Button>
  );
  return <PanelToolbar search={manager.search} onSearchChange={manager.setSearch} searchPlaceholder='Buscar por número de factura o título...' searchPlaceholderMobile='Buscar gastos...' data-testid={TEST_IDS.general.inputBusquedaTabla} filters={range} actions={add} />;
}

export function ExpensesPanel(): JSX.Element {
  const model = useExpensesPanel();
  const { manager, actions } = model;
  if (model.initialLoading) return <TableSkeleton />;
  const rowActions: ExpenseRowActions = { onEdit: (expense) => manager.openFormModal(expense), onDelete: manager.setItemToDelete };
  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden'>
      <ExpensesToolbar model={model} />
      <GlobalMessage message={manager.globalMessage} />
      <ResponsivePanelView columns={getExpenseColumns(rowActions)} data={model.visibleExpenses} isLoading={actions.isPending} emptyMessage={model.dates.start || model.dates.end ? 'No hay gastos en estas fechas.' : 'Todavía no hay gastos anotados.'} renderCard={renderExpenseCard(rowActions)} />
      <ExpenseFormModal model={model} />
      <ConfirmModal
        isOpen={Boolean(manager.itemToDelete)}
        onClose={() => manager.setItemToDelete(null)}
        onConfirm={() => actions.handleDelete(manager.itemToDelete ?? '')}
        title='Eliminar gasto'
        description='Se borra para siempre del anotador.'
        submitLabel='Eliminar'
        isPending={actions.isPending}
      />
    </div>
  );
}
