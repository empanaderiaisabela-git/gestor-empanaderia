import { Edit, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { CardAction, EntityCard } from '@/components/ui/entity-card';
import type { ShippingDef } from '@/features/shipping/domain/shipping.schema';
import { formatMoney } from '@/lib/format-money';
import type { ShippingRowActions } from './shipping-columns';

function StatusBadge({ isActive }: { isActive: boolean }): JSX.Element {
  const tone = isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200';
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tone}`}>{isActive ? 'Activo' : 'Inactivo'}</span>;
}

export function renderShippingCard(actions: ShippingRowActions): (shipping: ShippingDef) => JSX.Element {
  return function ShippingCard(shipping: ShippingDef): JSX.Element {
    const details = <span className='mt-1 text-sm text-zinc-700 dark:text-zinc-200'>{[shipping.detail, formatMoney(shipping.amount)].filter(Boolean).join(' · ')}</span>;
    const toggleIcon = shipping.isActive ? <ToggleRight className='w-4 h-4' /> : <ToggleLeft className='w-4 h-4' />;
    const buttons = (
      <>
        <CardAction icon={toggleIcon} label={shipping.isActive ? 'Desactivar' : 'Activar'} onClick={() => actions.onToggleActive(shipping)} variant={shipping.isActive ? 'warning' : 'success'} />
        <CardAction icon={<Edit className='w-4 h-4' />} label='Editar' onClick={() => actions.onEdit(shipping)} />
        <CardAction icon={<Trash2 className='w-4 h-4' />} label='Eliminar' onClick={() => actions.onDelete(shipping.id)} variant='danger' />
      </>
    );
    return <EntityCard key={shipping.id} title={shipping.title} badges={<StatusBadge isActive={shipping.isActive} />} details={details} actions={buttons} />;
  };
}
