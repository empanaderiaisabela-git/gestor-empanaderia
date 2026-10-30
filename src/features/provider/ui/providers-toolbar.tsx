import { Plus } from 'lucide-react';
import type { JSX } from 'react';
import { Button } from '@/components/ui/button';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { TEST_IDS } from '@/constants/test-ids';
import type { ProvidersPanelModel } from './use-providers-panel';

export function ProvidersToolbar({ model }: { model: ProvidersPanelModel }): JSX.Element {
  const { role, manager, actions } = model;
  const isAdmin = role === 'admin';
  return (
    <PanelToolbar
      search={manager.search}
      onSearchChange={manager.setSearch}
      searchPlaceholder='Buscar distribuidor por nombre, teléfono o email...'
      searchPlaceholderMobile='Buscar proveedores...'
      data-testid={TEST_IDS.general.inputBusquedaTabla}
      filters={<ToggleFilter id='showInactive-provider' checked={model.showInactive} onChange={model.setShowInactive} label='Ver Inactivos' data-testid={TEST_IDS.general.btnVerOcultos} />}
      actions={
        isAdmin && (
          <Button variant='primary' onClick={() => manager.openFormModal()} leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
            <span className='hidden sm:inline'>Agregar Proveedor</span>
            <span className='sm:hidden'>Agregar</span>
          </Button>
        )
      }
    />
  );
}
