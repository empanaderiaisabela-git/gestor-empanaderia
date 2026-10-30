import { Plus } from 'lucide-react';
import type { JSX } from 'react';
import { Button } from '@/components/ui/button';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { TEST_IDS } from '@/constants/test-ids';
import { GROUPS, MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import type { GroupFilter, MenuPanelModel } from './use-menu-panel';

const FILTERS: readonly GroupFilter[] = ['todos', ...MENU_GROUPS];
const labelOf = (filter: GroupFilter): string => (filter === 'todos' ? 'Todos los grupos' : GROUPS[filter].label);
const isFilter = (value: string): value is GroupFilter => FILTERS.some((filter) => filter === value);

function GroupSelect({ model }: { model: MenuPanelModel }): JSX.Element {
  return (
    <select
      aria-label='Filtrar por grupo'
      value={model.groupFilter}
      onChange={(event) => isFilter(event.target.value) && model.setGroupFilter(event.target.value)}
      className='h-11 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm'
    >
      {FILTERS.map((filter) => (
        <option key={filter} value={filter}>
          {labelOf(filter)}
        </option>
      ))}
    </select>
  );
}

export function MenuToolbar({ model }: { model: MenuPanelModel }): JSX.Element {
  const { manager, actions } = model;
  return (
    <PanelToolbar
      search={manager.search}
      onSearchChange={manager.setSearch}
      searchPlaceholder='Buscar gusto o bebida por nombre...'
      searchPlaceholderMobile='Buscar gustos...'
      data-testid={TEST_IDS.general.inputBusquedaTabla}
      filters={
        <>
          <GroupSelect model={model} />
          <ToggleFilter id='showInactive-menu' checked={model.showInactive} onChange={model.setShowInactive} label='Ver Inactivos' data-testid={TEST_IDS.general.btnVerOcultos} />
        </>
      }
      actions={
        <Button variant='primary' onClick={() => manager.openFormModal()} leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
          Nuevo gusto o bebida
        </Button>
      }
    />
  );
}
