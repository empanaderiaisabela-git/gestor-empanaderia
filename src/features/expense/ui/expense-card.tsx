import { Edit, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { CardAction, EntityCard } from '@/components/ui/entity-card';
import type { ExpenseDef } from '@/features/expense/domain/expense.schema';
import { formatMoney } from '@/lib/format-money';
import type { ExpenseRowActions } from './expense-columns';
import { formatInvoiceDate } from './expense-form';

export function renderExpenseCard(actions: ExpenseRowActions): (expense: ExpenseDef) => JSX.Element {
  return function ExpenseCard(expense: ExpenseDef): JSX.Element {
    const badge = <span className='px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'>{formatInvoiceDate(expense.invoiceDate)}</span>;
    const details = (
      <span className='mt-1 text-sm text-zinc-700 dark:text-zinc-200'>
        Factura {expense.invoiceNumber} · {expense.providerName ?? '—'} · {formatMoney(expense.amount)}
      </span>
    );
    const buttons = (
      <>
        <CardAction icon={<Edit className='w-4 h-4' />} label='Editar' onClick={() => actions.onEdit(expense)} />
        <CardAction icon={<Trash2 className='w-4 h-4' />} label='Eliminar' onClick={() => actions.onDelete(expense.id)} variant='danger' />
      </>
    );
    return <EntityCard key={expense.id} title={expense.title} badges={badge} details={details} actions={buttons} />;
  };
}
