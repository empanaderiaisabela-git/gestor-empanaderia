import { Plus, RefreshCcw } from 'lucide-react';
import type { JSX } from 'react';
import { Button } from '@/components/ui/button';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { TEST_IDS } from '@/constants/test-ids';
import type { CardsPanelModel } from './use-cards-panel';

export function CardsToolbar({ model }: { model: CardsPanelModel }): JSX.Element {
  const { manager, actions } = model;
  return (
    <PanelToolbar
      search={manager.search}
      onSearchChange={manager.setSearch}
      searchPlaceholder='Buscar tarjeta por nombre...'
      searchPlaceholderMobile='Buscar tarjetas...'
      data-testid={TEST_IDS.general.inputBusquedaTabla}
      filters={<ToggleFilter id='showInactive-card' checked={model.showInactive} onChange={model.setShowInactive} label='Ver Inactivas' data-testid={TEST_IDS.general.btnVerOcultos} />}
      sync={
        <Button variant='secondary' size='icon' onClick={() => actions.syncData(true)} disabled={actions.isPending} title='Sincronizar Datos' className='h-11 w-11 flex-none' data-testid={TEST_IDS.general.btnSincronizar}>
          <RefreshCcw className={`w-5 h-5 ${actions.isPending ? 'animate-spin' : ''}`} />
        </Button>
      }
      actions={
        <Button variant='primary' onClick={() => manager.openFormModal()} leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
          Nueva tarjeta
        </Button>
      }
    />
  );
}
