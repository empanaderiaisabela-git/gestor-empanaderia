import { Edit, Plus, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import type { ColumnDef } from '@/components/ui/virtualized-data-table';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';

export type ProviderRowActions = {
  role?: string;
  onEdit: (provider: ProviderDef) => void;
  onToggleActive: (provider: ProviderDef) => void;
  onDelete: (id: string) => void;
};

function NameCell({ provider }: { provider: ProviderDef }): JSX.Element {
  return (
    <div className='flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 truncate min-w-0' title={provider.name}>
      <span className='truncate'>{provider.name}</span>
      {!provider.isActive && <span className='shrink-0 px-1.5 py-0.5 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase'>Inactivo</span>}
    </div>
  );
}

function RowActions({ provider, actions }: { provider: ProviderDef; actions: ProviderRowActions }): JSX.Element {
  const toggleClass = provider.isActive ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10' : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10';
  return (
    <>
      <button onClick={() => actions.onToggleActive(provider)} className={`p-1.5 rounded-lg transition ${toggleClass}`} title={provider.isActive ? 'Desactivar' : 'Activar'}>
        <Plus className={`w-4 h-4 ${provider.isActive ? 'rotate-45' : ''}`} />
      </button>
      <button onClick={() => actions.onEdit(provider)} className='p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition' title='Editar'>
        <Edit className='w-4 h-4' />
      </button>
      <button onClick={() => actions.onDelete(provider.id)} className='p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition' title='Eliminar'>
        <Trash2 className='w-4 h-4' />
      </button>
    </>
  );
}

export function getProviderColumns(actions: ProviderRowActions): ColumnDef<ProviderDef>[] {
  const columns: ColumnDef<ProviderDef>[] = [
    { header: 'Empresa / Mayorista', cellClassName: 'max-w-[200px]', cell: (provider) => <NameCell provider={provider} /> },
    { header: 'Teléfono', cellClassName: 'text-zinc-500', cell: (provider) => provider.phone || '---' },
    { header: 'Correo', cellClassName: 'text-zinc-500 max-w-[150px] truncate', cell: (provider) => <span title={provider.email || '---'}>{provider.email || '---'}</span> },
  ];
  if (actions.role !== 'admin') return columns;
  return [...columns, { header: 'Acciones', headerClassName: 'text-right', cellClassName: 'flex gap-1 justify-end', cell: (provider) => <RowActions provider={provider} actions={actions} /> }];
}
