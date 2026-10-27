import { Camera, Edit, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import type { ColumnDef } from '@/components/ui/virtualized-data-table';
import { GROUPS } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { priceSummary } from '@/features/menu/domain/menu-price-list';
import { COST_TERM, SALE_PRICE_TERM } from '@/features/menu/domain/menu-terms';
import { formatMoney } from '@/lib/format-money';

export type MenuItemRowActions = {
  onEdit: (item: MenuItemDef) => void;
  onToggleActive: (item: MenuItemDef) => void;
  onDelete: (id: string) => void;
  onToggleVisible: (item: MenuItemDef) => void;
  onPhotos: (item: MenuItemDef) => void;
};

function NameCell({ item }: { item: MenuItemDef }): JSX.Element {
  return (
    <div className='flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 min-w-0' title={item.name}>
      <span className='line-clamp-2 break-words'>{item.name}</span>
      {!item.isActive && <span className='shrink-0 px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase'>Inactivo</span>}
      {item.isVisible && <span className='shrink-0 px-1.5 py-0.5 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 text-[10px] font-bold rounded uppercase'>En catálogo</span>}
    </div>
  );
}

export function MenuItemRowButtons({ item, actions }: { item: MenuItemDef; actions: MenuItemRowActions }): JSX.Element {
  const toggleClass = item.isActive ? 'text-amber-700 hover:bg-amber-50 dark:text-amber-400' : 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400';
  const button = 'p-1.5 rounded-lg transition text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10';
  return (
    <>
      <button onClick={() => actions.onToggleVisible(item)} className={button} title={item.isVisible ? 'Ocultar del catálogo' : 'Mostrar en el catálogo'}>
        {item.isVisible ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
      </button>
      <button onClick={() => actions.onPhotos(item)} className={button} title='Fotos'>
        <Camera className='w-4 h-4' />
      </button>
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
    { header: 'Grupo', headerClassName: 'w-32', cellClassName: 'text-zinc-500', cell: (item) => GROUPS[item.group].label },
    { header: 'Gusto / bebida', headerClassName: 'w-[36%]', cell: (item) => <NameCell item={item} /> },
    { header: COST_TERM, cellClassName: 'text-zinc-500', cell: (item) => (item.unitCost === null ? '—' : formatMoney(item.unitCost)) },
    { header: SALE_PRICE_TERM, cellClassName: 'text-zinc-600 dark:text-zinc-300 text-sm', cell: (item) => priceSummary(item) },
    { header: 'Stock', cellClassName: 'text-zinc-500', cell: (item) => item.stock.toLocaleString('es-AR') },
    { header: 'Acciones', headerClassName: 'w-44 text-right', cellClassName: 'flex gap-1 justify-end', cell: (item) => <MenuItemRowButtons item={item} actions={actions} /> },
  ];
}
