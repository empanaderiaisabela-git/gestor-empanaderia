import { History, type LucideIcon, PackageMinus, PackagePlus, Tags } from 'lucide-react';
import type { JSX } from 'react';
import type { ColumnDef } from '@/components/ui/virtualized-data-table';
import { GROUPS, hasBase } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { priceList } from '@/features/menu/domain/menu-price-list';
import { COST_TERM, SALE_PRICE_TERM } from '@/features/menu/domain/menu-terms';
import { formatMoney } from '@/lib/format-money';
import type { StockDialog } from './use-stock-panel';

export type StockRowActions = { open: (dialog: StockDialog) => void };
type DialogKind = NonNullable<StockDialog>['kind'];

const BUTTONS: Record<DialogKind, { title: string; tone: string; Icon: LucideIcon }> = {
  entry: { title: 'Ingresar stock', tone: 'text-emerald-700 dark:text-emerald-400', Icon: PackagePlus },
  loss: { title: 'Registrar pérdida', tone: 'text-amber-700 dark:text-amber-400', Icon: PackageMinus },
  pricing: { title: 'Costo y precio', tone: 'text-sky-700 dark:text-sky-400', Icon: Tags },
  history: { title: 'Historial de ingresos', tone: 'text-brand-600 dark:text-brand-400', Icon: History },
};

const isStockless = (item: MenuItemDef): boolean => hasBase(item.group) && !item.isBase;

function kindsOf(item: MenuItemDef): DialogKind[] {
  if (item.isBase) return ['entry', 'loss'];
  return isStockless(item) ? ['pricing'] : ['entry', 'loss', 'pricing', 'history'];
}

export function StockBadge({ item }: { item: MenuItemDef }): JSX.Element {
  if (isStockless(item)) return <>—</>;
  const empty = item.stock <= 0;
  const tone = empty ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
  return <span className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${tone}`}>{empty ? 'Sin stock' : item.stock.toLocaleString('es-AR')}</span>;
}

export function StockButtons({ item, actions }: { item: MenuItemDef; actions: StockRowActions }): JSX.Element {
  return (
    <>
      {kindsOf(item).map((kind) => {
        const { title, tone, Icon } = BUTTONS[kind];
        return (
          <button key={kind} onClick={() => actions.open({ kind, item })} className={`p-1.5 rounded-lg transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${tone}`} title={title}>
            <Icon className='w-4 h-4' />
          </button>
        );
      })}
    </>
  );
}

function PriceCell({ item }: { item: MenuItemDef }): JSX.Element {
  if (item.isBase) return <>—</>;
  if (item.price1 === null) return <>Sin precio</>;
  return (
    <ul>
      {priceList(item.group, item).map(({ field, label, value }) => (
        <li key={field} className='whitespace-nowrap'>{`${label}: ${formatMoney(value)}`}</li>
      ))}
    </ul>
  );
}

const costText = (item: MenuItemDef): string => {
  if (item.isBase) return '—';
  return item.unitCost === null ? 'Sin costo' : formatMoney(item.unitCost);
};

export function getStockViewColumns(): ColumnDef<MenuItemDef>[] {
  return [
    { header: 'Grupo', cellClassName: 'text-zinc-700 dark:text-zinc-200', cell: (item) => GROUPS[item.group].label },
    { header: 'Gusto / bebida', cellClassName: 'font-bold text-zinc-900 dark:text-zinc-50', cell: (item) => item.name },
    { header: 'Stock', cell: (item) => <StockBadge item={item} /> },
  ];
}

export function getStockColumns(actions: StockRowActions): ColumnDef<MenuItemDef>[] {
  const columns: ColumnDef<MenuItemDef>[] = [
    ...getStockViewColumns(),
    { header: SALE_PRICE_TERM, cellClassName: 'text-zinc-800 dark:text-zinc-100 text-sm', cell: (item) => <PriceCell item={item} /> },
  ];
  const cost: ColumnDef<MenuItemDef> = { header: COST_TERM, cellClassName: 'text-zinc-700 dark:text-zinc-200', cell: (item) => costText(item) };
  return [...columns, cost, { header: 'Acciones', headerClassName: 'text-right', cellClassName: 'flex gap-1 justify-end', cell: (item) => <StockButtons item={item} actions={actions} /> }];
}
