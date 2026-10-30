'use client';

import { ArrowLeft, Printer } from 'lucide-react';
import type { JSX } from 'react';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';
import { describeSoldPresentation } from '@/features/order/domain/order-describe';
import { describePayment } from '@/features/order/domain/payment-describe';
import { buyerContact, buyerLabel, type SaleDef } from '@/features/order/domain/sale-history.schema';
import { formatDateTime } from '@/lib/format-date-time';
import { formatMoney } from '@/lib/format-money';

type SaleReceiptProps = { sale: SaleDef; onClose: () => void };

const row = 'flex justify-between gap-4';

function ReceiptTotals({ sale }: { sale: SaleDef }): JSX.Element {
  const subtotal = sale.lines.reduce((sum, line) => sum + line.subtotal, 0);
  return (
    <div className='space-y-1 text-sm border-t border-zinc-200 pt-4'>
      <p className={row}>
        <span>Subtotal</span>
        <span>{formatMoney(subtotal)}</span>
      </p>
      {sale.discountPercentage > 0 && <p className={row}><span>Descuento</span><span>-{sale.discountPercentage}%</span></p>}
      {sale.discountAmount > 0 && <p className={row}><span>Descuento</span><span>-{formatMoney(sale.discountAmount)}</span></p>}
      <p className={`${row} text-xl font-black`}>
        <span>Total</span>
        <span>{formatMoney(sale.total)}</span>
      </p>
      {sale.payments.map((payment) => (
        <p key={payment.type} className={`${row} text-zinc-800`}>
          <span>{describePayment(payment)}</span>
          <span>{formatMoney(payment.amount)}</span>
        </p>
      ))}
    </div>
  );
}

function ReceiptLines({ sale }: { sale: SaleDef }): JSX.Element {
  return (
    <table className='w-full text-sm'>
      <thead className='text-left text-xs uppercase text-zinc-700'>
        <tr>
          <th className='py-2'>Comida</th>
          <th className='py-2'>Gustos</th>
          <th className='py-2 text-right'>Importe</th>
        </tr>
      </thead>
      <tbody>
        {sale.lines.map((line, index) => (
          <tr key={index} className='border-t border-zinc-100'>
            <td className='py-2 pr-2'>{describeSoldPresentation(line)}</td>
            <td className='py-2 pr-2'>{line.description}</td>
            <td className='py-2 text-right'>{formatMoney(line.subtotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SaleReceipt({ sale, onClose }: SaleReceiptProps): JSX.Element {
  return (
    <div className='flex flex-col h-full gap-4 overflow-hidden'>
      <div className='flex items-center justify-between no-print'>
        <Button variant='secondary' size='sm' onClick={onClose} leftIcon={<ArrowLeft className='w-4 h-4' />}>
          Volver
        </Button>
        <Button size='sm' onClick={() => window.print()} leftIcon={<Printer className='w-4 h-4' />}>
          Imprimir comprobante
        </Button>
      </div>
      <div className='flex-1 overflow-auto'>
        <article id='print-area-wrapper' aria-label='Comprobante' className='bg-white text-zinc-900 p-6 sm:p-10 border border-zinc-200 rounded-xl max-w-2xl mx-auto space-y-6'>
          <div className='flex items-start justify-between gap-4 border-b border-zinc-200 pb-4'>
            <div className='flex items-center gap-3'>
              <img src={BRAND.logoSrc} alt='' className='w-14 h-14 rounded-full object-cover' />
              <p className='text-xl font-black'>{BRAND.name}</p>
            </div>
            <div className='text-right text-sm'>
              <p className='font-bold'>Venta {sale.id.slice(0, 8).toUpperCase()}</p>
              <p className='text-zinc-700'>{formatDateTime(sale.createdAt)}</p>
            </div>
          </div>
          <p className='text-sm'>
            Comprador: <strong>{buyerLabel(sale.buyerName)}</strong> · Vendedor: <strong>{sale.vendorName}</strong>
          </p>
          {buyerContact(sale) && <p className='text-sm'>{buyerContact(sale)}</p>}
          <ReceiptLines sale={sale} />
          <ReceiptTotals sale={sale} />
        </article>
      </div>
    </div>
  );
}
