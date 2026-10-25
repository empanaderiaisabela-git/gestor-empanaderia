import { Edit, Plus, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import type { ColumnDef } from '@/components/ui/virtualized-data-table';
import { GROUPS, isPricedByGroup } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { priceList } from '@/features/menu/domain/menu-price-list';
import { formatMoney } from '@/lib/format-money';

export type MenuItemRowActions = {
  onEdit: (item: MenuItemDef) => void;
  onToggleActive: (item: MenuItemDef) => void;
  onDelete: (id: string) => void;
};

export function priceSummary(item: MenuItemDef): string {
  if (isPricedByGroup(item.group)) return `Precio de ${GROUPS[item.group].label}`;
  return priceList(item.group, item)
    .map(({ label, value }) => `${label}: ${formatMoney(value)}`)
    .join(' · ');
}

function NameCell({ item }: { item: MenuItemDef }): JSX.Element {
  return (
    <div className='flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 truncate min-w-0' title={item.name}>
      <span className='truncate'>{item.name}</span>
      {!item.isActive && <span className='shrink-0 px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase'>Inactivo</span>}
    </div>
  );
}

export function MenuItemRowButtons({ item, actions }: { item: MenuItemDef; actions: MenuItemRowActions }): JSX.Element {
  const toggleClass = item.isActive ? 'text-amber-700 hover:bg-amber-50 dark:text-amber-400' : 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400';
  return (
    <>
      <button onClick={() => actions.onToggleActive(item)} className={`p-1.5 rounded-lg transition ${toggleClass}`} title={item.isActive ? 'Desactivar' : 'Activar'}>
        <Plus className={`w-4 h-4 ${item.isActive ? 'rotate-45' : ''}`} />
      </button>
      <button onClick={() => actions.onEdit(item)} className='p-1.5 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition' title='Editar'>
        <Edit className='w-4 h-4' />
      </button>
      <button onClick={() => actions.onDelete(item.id)} className='p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition' title='Eliminar'>
        <Trash2 className='w-4 h-4' />
      </button>
    </>
  );
}

export function getMenuItemColumns(actions: MenuItemRowActions): ColumnDef<MenuItemDef>[] {
  return [
    { header: 'Grupo', cellClassName: 'text-zinc-500', cell: (item) => GROUPS[item.group].label },
    { header: 'Gusto / bebida', cellClassName: 'max-w-[220px]', cell: (item) => <NameCell item={item} /> },
    { header: 'Costo', cellClassName: 'text-zinc-500', cell: (item) => (item.unitCost === null ? '—' : formatMoney(item.unitCost)) },
    { header: 'Precio', cellClassName: 'text-zinc-600 dark:text-zinc-300 text-sm', cell: (item) => priceSummary(item) },
    { header: 'Stock', cellClassName: 'text-zinc-500', cell: (item) => item.stock.toLocaleString('es-AR') },
    { header: 'Acciones', headerClassName: 'text-right', cellClassName: 'flex gap-1 justify-end', cell: (item) => <MenuItemRowButtons item={item} actions={actions} /> },
  ];
}
