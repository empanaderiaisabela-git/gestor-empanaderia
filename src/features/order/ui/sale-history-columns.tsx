import { FileText, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { EntityCard } from '@/components/ui/entity-card';
import type { ColumnDef } from '@/components/ui/virtualized-data-table';
import { describeSaleLine } from '@/features/order/domain/order-describe';
import { describePayment } from '@/features/order/domain/payment-describe';
import { buyerLabel, type SaleDef } from '@/features/order/domain/sale-history.schema';
import { formatDateTime } from '@/lib/format-date-time';
import { formatMoney } from '@/lib/format-money';

export type SaleRowActions = { isAdmin: boolean; onReceipt: (sale: SaleDef) => void; onVoid: (sale: SaleDef) => void };

const chip = 'px-1.5 py-0.5 text-xs font-bold uppercase rounded bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300';

export function PaymentChips({ sale }: { sale: SaleDef }): JSX.Element {
  return (
    <span className='flex flex-wrap gap-1'>
      {sale.payments.map((payment) => (
        <span key={payment.type} className={chip} title={`${describePayment(payment)}: ${formatMoney(payment.amount)}`}>
          {describePayment(payment)}
        </span>
      ))}
    </span>
  );
}

function DiscountCell({ sale }: { sale: SaleDef }): JSX.Element {
  const parts = [sale.discountPercentage > 0 && `-${sale.discountPercentage}%`, sale.discountAmount > 0 && `-${formatMoney(sale.discountAmount)}`].filter(Boolean);
  return <span className='text-emerald-700 dark:text-emerald-400 font-bold'>{parts.length > 0 ? parts.join(' ') : '—'}</span>;
}

export function SaleButtons({ sale, actions }: { sale: SaleDef; actions: SaleRowActions }): JSX.Element {
  const button = 'p-1.5 rounded-lg transition hover:bg-zinc-100 dark:hover:bg-zinc-800';
  return (
    <>
      <button onClick={() => actions.onReceipt(sale)} className={`${button} text-brand-600 dark:text-brand-400`} title='Ver comprobante'>
        <FileText className='w-4 h-4' />
      </button>
      {actions.isAdmin && (
        <button onClick={() => actions.onVoid(sale)} className={`${button} text-red-600 dark:text-red-400`} title='Anular venta'>
          <Trash2 className='w-4 h-4' />
        </button>
      )}
    </>
  );
}

const orderSummary = (sale: SaleDef): string => sale.lines.map(describeSaleLine).join(' · ');

const pad = 'px-3!';

export function getSaleHistoryColumns(actions: SaleRowActions): ColumnDef<SaleDef>[] {
  return [
    { header: 'Fecha y hora', headerClassName: `${pad} w-44`, cellClassName: `${pad} whitespace-nowrap font-bold text-zinc-900 dark:text-zinc-50`, cell: (sale) => formatDateTime(sale.createdAt) },
    { header: 'Comprador', headerClassName: `${pad} w-28`, cellClassName: `${pad} truncate`, cell: (sale) => buyerLabel(sale.buyerName) },
    { header: 'Vendedor', headerClassName: `${pad} w-24`, cellClassName: `${pad} text-zinc-700 dark:text-zinc-200 truncate`, cell: (sale) => sale.vendorName },
    { header: 'Pedido', headerClassName: pad, cellClassName: `${pad} text-zinc-700 dark:text-zinc-200 break-words`, cell: (sale) => orderSummary(sale) },
    { header: 'Pago', headerClassName: `${pad} w-32`, cellClassName: pad, cell: (sale) => <PaymentChips sale={sale} /> },
    { header: 'Desc.', headerClassName: `${pad} w-20 text-right`, cellClassName: `${pad} text-right`, cell: (sale) => <DiscountCell sale={sale} /> },
    { header: 'Total', headerClassName: `${pad} w-28 text-right`, cellClassName: `${pad} text-right font-black text-zinc-900 dark:text-zinc-50`, cell: (sale) => formatMoney(sale.total) },
    { header: 'Acciones', headerClassName: `${pad} w-28 text-right`, cellClassName: `${pad} flex gap-1 justify-end`, cell: (sale) => <SaleButtons sale={sale} actions={actions} /> },
  ];
}

export const renderSaleCard = (actions: SaleRowActions) =>
  function SaleCard(sale: SaleDef): JSX.Element {
    const badges = <span className='font-black text-zinc-900 dark:text-zinc-50'>{formatMoney(sale.total)}</span>;
    return <EntityCard key={sale.id} title={buyerLabel(sale.buyerName)} subtitle={`${formatDateTime(sale.createdAt)} · ${sale.vendorName}`} badges={badges} details={<PaymentChips sale={sale} />} actions={<SaleButtons sale={sale} actions={actions} />} />;
  };
