import { Edit, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { CardAction, EntityCard } from '@/components/ui/entity-card';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';
import type { ProviderRowActions } from './provider-columns';

function StatusBadge({ isActive }: { isActive: boolean }): JSX.Element {
  const tone = isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200';
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tone}`}>{isActive ? 'Activo' : 'Inactivo'}</span>;
}

function ContactDetails({ provider }: { provider: ProviderDef }): JSX.Element {
  return (
    <div className='flex flex-col gap-1 mt-1'>
      <div className='flex justify-between'>
        <span className='text-xs text-zinc-600 dark:text-zinc-300'>Teléfono</span>
        <span className='truncate max-w-[180px]'>{provider.phone}</span>
      </div>
      <div className='flex justify-between'>
        <span className='text-xs text-zinc-600 dark:text-zinc-300'>Email</span>
        <span className='truncate max-w-[180px]'>{provider.email}</span>
      </div>
    </div>
  );
}

function CardActions({ provider, actions }: { provider: ProviderDef; actions: ProviderRowActions }): JSX.Element {
  const toggleIcon = provider.isActive ? <ToggleRight className='w-4 h-4' /> : <ToggleLeft className='w-4 h-4' />;
  return (
    <>
      <CardAction icon={toggleIcon} label={provider.isActive ? 'Desactivar' : 'Activar'} onClick={() => actions.onToggleActive(provider)} variant={provider.isActive ? 'warning' : 'success'} />
      <CardAction icon={<Edit className='w-4 h-4' />} label='Editar' onClick={() => actions.onEdit(provider)} />
      {actions.role === 'admin' && <CardAction icon={<Trash2 className='w-4 h-4' />} label='Eliminar' onClick={() => actions.onDelete(provider.id)} variant='danger' />}
    </>
  );
}

export function renderProviderCard(actions: ProviderRowActions): (provider: ProviderDef) => JSX.Element {
  return function ProviderCard(provider: ProviderDef): JSX.Element {
    return (
      <EntityCard
        key={provider.id}
        title={provider.name}
        badges={<StatusBadge isActive={provider.isActive} />}
        details={<ContactDetails provider={provider} />}
        actions={<CardActions provider={provider} actions={actions} />}
      />
    );
  };
}
