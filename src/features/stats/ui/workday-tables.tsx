import type { JSX, ReactNode } from 'react';
import { SHIFT_LABELS } from '@/features/stats/domain/shift';
import type { SaleRow, VendorRow } from '@/features/stats/domain/stats.schema';
import { argentinaTime } from '@/lib/format-date-time';
import { formatMoney } from '@/lib/format-money';

type TableProps = { title: string; headers: string[]; empty: string; children: ReactNode[] };

const cell = 'py-2 pr-3';

function StatsTable({ title, headers, empty, children }: TableProps): JSX.Element {
  return (
    <section className='rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2'>
      <h2 className='text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400'>{title}</h2>
      {children.length === 0 ? (
        <p className='text-sm text-zinc-500'>{empty}</p>
      ) : (
        <table aria-label={title} className='w-full text-left text-sm'>
          <thead className='text-xs uppercase text-zinc-500'>
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
    <StatsTable title='Vendedores' headers={['Vendedor', 'Turno', 'Ventas', 'Importe']} empty='Nadie vendió en esta jornada.'>
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

export function SalesTable({ rows }: { rows: SaleRow[] }): JSX.Element {
  return (
    <StatsTable title='Ventas' headers={['Comprador', 'Hora', 'Importe']} empty='No hubo ventas en esta jornada.'>
      {rows.map((row, index) => (
        <tr key={`${row.at}-${index}`} className='border-t border-zinc-100 dark:border-zinc-800'>
          <td className={cell}>{row.buyer}</td>
          <td className={cell}>{argentinaTime(row.at)}</td>
          <td className={`${cell} text-right font-semibold`}>{formatMoney(row.amount)}</td>
        </tr>
      ))}
    </StatsTable>
  );
}
