import type { JSX, ReactNode } from 'react';
import { SHIFT_LABELS } from '@/features/stats/domain/shift';
import type { SaleRow, VendorRow } from '@/features/stats/domain/stats.schema';
import { argentinaTime, formatDateTime } from '@/lib/format-date-time';
import { formatMoney } from '@/lib/format-money';

type TableProps = { title: string; headers: string[]; empty: string; children: ReactNode[] };

const cell = 'py-2 pr-3';

function StatsTable({ title, headers, empty, children }: TableProps): JSX.Element {
  return (
    <section className='rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2'>
      <h2 className='text-base font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200'>{title}</h2>
      {children.length === 0 ? (
        <p className='text-sm text-zinc-700 dark:text-zinc-200'>{empty}</p>
      ) : (
        <table aria-label={title} className='w-full text-left text-sm'>
          <thead className='text-xs uppercase text-zinc-700 dark:text-zinc-200'>
            <tr>
              {headers.map((header, index) => (
                <th key={header} className={`${cell} ${index === headers.length - 1 ? 'text-right' : ''}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      )}
    </section>
  );
}

export function VendorsTable({ rows }: { rows: VendorRow[] }): JSX.Element {
  return (
    <StatsTable title='Vendedores' headers={['Vendedor', 'Turno', 'Ventas', 'Importe']} empty='Nadie vendió en estas fechas.'>
      {rows.map((row) => (
        <tr key={`${row.vendor}-${row.shift}`} className='border-t border-zinc-100 dark:border-zinc-800'>
          <td className={`${cell} font-semibold`}>{row.vendor}</td>
          <td className={cell}>{SHIFT_LABELS[row.shift]}</td>
          <td className={cell}>{row.count.toLocaleString('es-AR')}</td>
          <td className={`${cell} text-right font-semibold`}>{formatMoney(row.amount)}</td>
        </tr>
      ))}
    </StatsTable>
  );
}

export function SalesTable({ rows, withDate }: { rows: SaleRow[]; withDate: boolean }): JSX.Element {
  return (
    <StatsTable title='Ventas' headers={['Comprador', withDate ? 'Fecha y hora' : 'Hora', 'Importe']} empty='No hubo ventas en estas fechas.'>
      {rows.map((row, index) => (
        <tr key={`${row.at}-${index}`} className='border-t border-zinc-100 dark:border-zinc-800'>
          <td className={cell}>{row.buyer}</td>
          <td className={cell}>{withDate ? formatDateTime(row.at) : argentinaTime(row.at)}</td>
          <td className={`${cell} text-right font-semibold`}>{formatMoney(row.amount)}</td>
        </tr>
      ))}
    </StatsTable>
  );
}
