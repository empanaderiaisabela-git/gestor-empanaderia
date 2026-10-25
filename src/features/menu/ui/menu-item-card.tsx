import { Camera, Edit, Eye, EyeOff, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { CardAction, EntityCard } from '@/components/ui/entity-card';
import { GROUPS } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { formatMoney } from '@/lib/format-money';
import { priceSummary } from '@/features/menu/domain/menu-price-list';
import type { MenuItemRowActions } from './menu-item-columns';

function Details({ item }: { item: MenuItemDef }): JSX.Element {
  return (
    <div className='flex flex-col gap-1 mt-1 text-sm'>
      <span className='text-zinc-500'>{priceSummary(item)}</span>
      <span className='text-xs text-zinc-400'>
        Costo {item.unitCost === null ? '—' : formatMoney(item.unitCost)} · Stock {item.stock.toLocaleString('es-AR')}
      </span>
    </div>
  );
}

function CardButtons({ item, actions }: { item: MenuItemDef; actions: MenuItemRowActions }): JSX.Element {
  const toggleIcon = item.isActive ? <ToggleRight className='w-4 h-4' /> : <ToggleLeft className='w-4 h-4' />;
  return (
    <>
      <CardAction icon={toggleIcon} label={item.isActive ? 'Desactivar' : 'Activar'} onClick={() => actions.onToggleActive(item)} variant={item.isActive ? 'warning' : 'success'} />
      <CardAction icon={item.isVisible ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />} label={item.isVisible ? 'Ocultar del catálogo' : 'Mostrar en el catálogo'} onClick={() => actions.onToggleVisible(item)} />
      <CardAction icon={<Camera className='w-4 h-4' />} label='Fotos' onClick={() => actions.onPhotos(item)} />
      <CardAction icon={<Edit className='w-4 h-4' />} label='Editar' onClick={() => actions.onEdit(item)} />
      <CardAction icon={<Trash2 className='w-4 h-4' />} label='Eliminar' onClick={() => actions.onDelete(item.id)} variant='danger' />
    </>
  );
}

export function renderMenuItemCard(actions: MenuItemRowActions): (item: MenuItemDef) => JSX.Element {
  return function MenuItemCard(item: MenuItemDef): JSX.Element {
    const badge = <span className='px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'>{GROUPS[item.group].label}</span>;
    return <EntityCard key={item.id} title={item.name} badges={badge} details={<Details item={item} />} actions={<CardButtons item={item} actions={actions} />} />;
  };
}
