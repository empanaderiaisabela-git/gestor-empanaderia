import { History, PackageMinus, PackagePlus, Tags } from 'lucide-react';
import type { JSX } from 'react';
import type { ColumnDef } from '@/components/ui/virtualized-data-table';
import { GROUPS } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { priceList } from '@/features/menu/domain/menu-price-list';
import { COST_TERM, SALE_PRICE_TERM } from '@/features/menu/domain/menu-terms';
import { formatMoney } from '@/lib/format-money';
import type { StockDialog } from './use-stock-panel';

export type StockRowActions = { open: (dialog: StockDialog) => void };

export function StockBadge({ item }: { item: MenuItemDef }): JSX.Element {
  const empty = item.stock <= 0;
  const tone = empty ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
  return <span className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${tone}`}>{empty ? 'Sin stock' : item.stock.toLocaleString('es-AR')}</span>;
}

export function StockButtons({ item, actions }: { item: MenuItemDef; actions: StockRowActions }): JSX.Element {
  const button = 'p-1.5 rounded-lg transition hover:bg-zinc-100 dark:hover:bg-zinc-800';
  return (
    <>
      <button onClick={() => actions.open({ kind: 'entry', item })} className={`${button} text-emerald-700 dark:text-emerald-400`} title='Ingresar stock'>
        <PackagePlus className='w-4 h-4' />
      </button>
      <button onClick={() => actions.open({ kind: 'loss', item })} className={`${button} text-amber-700 dark:text-amber-400`} title='Registrar pérdida'>
        <PackageMinus className='w-4 h-4' />
      </button>
      <button onClick={() => actions.open({ kind: 'pricing', item })} className={`${button} text-sky-700 dark:text-sky-400`} title='Costo y precio'>
        <Tags className='w-4 h-4' />
      </button>
      <button onClick={() => actions.open({ kind: 'history', item })} className={`${button} text-brand-600 dark:text-brand-400`} title='Historial de ingresos'>
        <History className='w-4 h-4' />
      </button>
    </>
  );
}

function PriceCell({ item }: { item: MenuItemDef }): JSX.Element {
  if (item.price1 === null) return <>Sin precio</>;
  return (
    <ul>
      {priceList(item.group, item).map(({ field, label, value }) => (
        <li key={field} className='whitespace-nowrap'>{`${label}: ${formatMoney(value)}`}</li>
      ))}
    </ul>
  );
}

export function getStockColumns(actions: StockRowActions): ColumnDef<MenuItemDef>[] {
  const columns: ColumnDef<MenuItemDef>[] = [
    { header: 'Grupo', cellClassName: 'text-zinc-700 dark:text-zinc-200', cell: (item) => GROUPS[item.group].label },
    { header: 'Gusto / bebida', cellClassName: 'font-bold text-zinc-900 dark:text-zinc-50', cell: (item) => item.name },
    { header: 'Stock', cell: (item) => <StockBadge item={item} /> },
    { header: SALE_PRICE_TERM, cellClassName: 'text-zinc-800 dark:text-zinc-100 text-sm', cell: (item) => <PriceCell item={item} /> },
  ];
  const cost: ColumnDef<MenuItemDef> = { header: COST_TERM, cellClassName: 'text-zinc-700 dark:text-zinc-200', cell: (item) => (item.unitCost === null ? 'Sin costo' : formatMoney(item.unitCost)) };
  return [...columns, cost, { header: 'Acciones', headerClassName: 'text-right', cellClassName: 'flex gap-1 justify-end', cell: (item) => <StockButtons item={item} actions={actions} /> }];
}
