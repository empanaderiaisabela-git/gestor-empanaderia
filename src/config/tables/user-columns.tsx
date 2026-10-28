import { type UserDef } from '@/features/user/domain/user.schema';
import { type ColumnDef } from '@/components/ui/virtualized-data-table';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface ColumnActions {
  currentUserId?: string;
  role?: string;
  onEdit: (u: UserDef) => void;
  onDelete: (id: string) => void;
  onToggleActive: (u: UserDef) => void;
}

export function getUserColumns({ currentUserId, role, onEdit, onDelete, onToggleActive }: ColumnActions): ColumnDef<UserDef>[] {
  return [
    {
      header: 'Usuario Creado',
      cell: (u) => (
        <div className='flex flex-col'>
          <div
            className='font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 truncate min-w-0'
            title={u.username}
          >
            <span className='truncate'>{u.username}</span>
            {!u.isActive && <span className='shrink-0 px-1.5 py-0.5 bg-zinc-100 text-zinc-700 dark:text-zinc-200 dark:bg-zinc-800 text-[10px] font-bold rounded uppercase tracking-tighter'>Inactivo</span>}
            {currentUserId === u.id && <span className='shrink-0 px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 text-[10px] uppercase font-bold ml-2'>Tú</span>}
          </div>
          <div className='text-[10px] text-zinc-700 dark:text-zinc-200 mt-0.5 uppercase font-medium tracking-tight'>
            ID:
            {u.id.split('-')[0]}
            ***
          </div>
        </div>
      ),
    },
    {
      header: 'Rol / Nivel',
      cell: (u) => <span className={`px-2.5 py-1 rounded-full text-[13px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900/30' : 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/10 dark:text-brand-400 dark:border-brand-900/30'}`}>{u.role === 'admin' ? 'Administrador' : 'Vendedor'}</span>,
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right font-bold',
      cellClassName: 'flex gap-1 justify-end',
      cell: (u: UserDef) => (
        <>
          <button
            disabled={currentUserId === u.id}
            onClick={() => onToggleActive(u)}
            className={`p-1.5 rounded-lg transition ${currentUserId === u.id ? 'opacity-20 cursor-not-allowed' : u.isActive ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10' : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'}`}
            title={u.isActive ? 'Desactivar' : 'Activar'}
          >
            <Plus className={`w-4 h-4 ${u.isActive ? 'rotate-45' : ''}`} />
          </button>

          <button
            onClick={() => onEdit(u)}
            className='p-1.5 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition'
            title='Editar Seguridad'
          >
            <Edit className='w-4 h-4' />
          </button>

          {role === 'admin' && (
            <button
              onClick={() => onDelete(u.id)}
              disabled={currentUserId === u.id}
              className={`p-1.5 rounded-lg transition ${currentUserId === u.id ? 'opacity-30 cursor-not-allowed text-zinc-700 dark:text-zinc-200' : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
              title='Retirar Acceso'
            >
              <Trash2 className='w-4 h-4' />
            </button>
          )}
        </>
      ),
    },
  ];
}
