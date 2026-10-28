import { Edit, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import type { ColumnDef } from '@/components/ui/virtualized-data-table';
import type { ExpenseDef } from '@/features/expense/domain/expense.schema';
import { formatMoney } from '@/lib/format-money';
import { formatInvoiceDate } from './expense-form';

export type ExpenseRowActions = { onEdit: (expense: ExpenseDef) => void; onDelete: (id: string) => void };

export function ExpenseRowButtons({ expense, actions }: { expense: ExpenseDef; actions: ExpenseRowActions }): JSX.Element {
  return (
    <>
      <button onClick={() => actions.onEdit(expense)} className='p-1.5 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition' title='Editar'>
        <Edit className='w-4 h-4' />
      </button>
      <button onClick={() => actions.onDelete(expense.id)} className='p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition' title='Eliminar'>
        <Trash2 className='w-4 h-4' />
      </button>
    </>
  );
}

export function getExpenseColumns(actions: ExpenseRowActions): ColumnDef<ExpenseDef>[] {
  return [
    { header: 'Fecha de la factura', cellClassName: 'text-zinc-700 dark:text-zinc-200', cell: (expense) => formatInvoiceDate(expense.invoiceDate) },
    { header: 'Número', cellClassName: 'font-mono text-sm', cell: (expense) => expense.invoiceNumber },
    { header: 'Título', cellClassName: 'font-bold text-zinc-900 dark:text-zinc-50 max-w-[260px] truncate', cell: (expense) => expense.title },
    { header: 'Monto', cellClassName: 'font-semibold', cell: (expense) => formatMoney(expense.amount) },
    { header: 'Acciones', headerClassName: 'text-right', cellClassName: 'flex gap-1 justify-end', cell: (expense) => <ExpenseRowButtons expense={expense} actions={actions} /> },
  ];
}
